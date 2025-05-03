from django.http import JsonResponse, HttpResponseRedirect
from .models import Bookmarks, TreeStructure, User
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.cache import cache
from django.http import HttpResponseForbidden
import re
from datetime import datetime
import json
import html

# Request rate limit
def rate_limit(view_func):
    def wrapped_view(request, *args, **kwargs):
        ip = request.META.get('REMOTE_ADDR')
        key = f'rate_limit:{ip}'
        limit = 10  # 每分鐘10次請求
        
        current = cache.get(key, 0)
        if current >= limit:
            return HttpResponseForbidden("請求過於頻繁，請稍後再試")
        
        cache.set(key, current + 1, 60)  # 60秒過期
        return view_func(request, *args, **kwargs)
    return wrapped_view

# XSS Protection - Sanitize function for strings
def sanitize_string(value):
    """
    Sanitizes a string value to prevent XSS attacks.
    Escapes HTML special characters and removes script tags.
    """
    if value is None:
        return None
    if not isinstance(value, str):
        return value
    
    # Escape HTML special characters
    value = html.escape(value)
    # Remove script and event handler patterns
    value = re.sub(r'<script.*?>.*?</script>', '', value, flags=re.IGNORECASE | re.DOTALL)
    value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)
    value = re.sub(r'on\w+\s*=', '', value, flags=re.IGNORECASE)
    
    return value
# XSS Protection - Sanitize function for data structures
def sanitize_data(data):
    """
    Recursively sanitizes data structures to prevent XSS attacks.
    Handles strings, lists, and dictionaries.
    """
    if isinstance(data, str):
        return sanitize_string(data)
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, dict):
        return {k: sanitize_data(v) for k, v in data.items()}
    else:
        return data

# validate bookmark data
def validate_bookmark_request(data, require_all_fields=False):
    required_fields = {
        'time': str,
        'parent_id': int,
        'children_id': list,
        'url': str,
        'img': str,
        'name': str,
        'tags': list,
        'starred': bool,
        'hidden': bool
    }
    length_limits = {
        'url': 2048,
        'img': 2048,
        'name': 255,
        'tags': 50,  # 每個標籤的最大長度
        'tags_count': 10  # 標籤數量上限
    }
    if 'url' in data and len(data['url']) > length_limits['url']:
        return False, JsonResponse({'status': 'error', 'message': f'URL長度不能超過{length_limits["url"]}個字符'}, status=400)
    
    if 'img' in data and len(data['img']) > length_limits['img']:
        return False, JsonResponse({'status': 'error', 'message': f'圖片URL長度不能超過{length_limits["img"]}個字符'}, status=400)
    
    if 'name' in data and len(data['name']) > length_limits['name']:
        return False, JsonResponse({'status': 'error', 'message': f'名稱長度不能超過{length_limits["name"]}個字符'}, status=400)
    
    if 'tags' in data:
        if len(data['tags']) > length_limits['tags_count']:
            return False, JsonResponse({'status': 'error', 'message': f'標籤數量不能超過{length_limits["tags_count"]}個'}, status=400)
        for tag in data['tags']:
            if len(tag) > length_limits['tags']:
                return False, JsonResponse({'status': 'error', 'message': f'每個標籤長度不能超過{length_limits["tags"]}個字符'}, status=400)

    validated = {}

    unknown_keys = set(data.keys()) - set(required_fields.keys())
    if unknown_keys:
        return False, JsonResponse({'status': 'error', 'message': f'Unknown fields: {list(unknown_keys)}'}, status=400)

    for key, expected_type in required_fields.items():
        value = data.get(key)

        if require_all_fields and value is None:
            return False, JsonResponse({'status': 'error', 'message': f'Missing field: {key}'}, status=400)

        if value is not None:
            if expected_type == int and not isinstance(value, int):
                return False, JsonResponse({'status': 'error', 'message': f'{key} must be an integer'}, status=400)
            if expected_type == str and not isinstance(value, str):
                return False, JsonResponse({'status': 'error', 'message': f'{key} must be a string'}, status=400)
            if expected_type == bool and not isinstance(value, bool):
                return False, JsonResponse({'status': 'error', 'message': f'{key} must be a boolean'}, status=400)
            if expected_type == list and not isinstance(value, list):
                return False, JsonResponse({'status': 'error', 'message': f'{key} must be a list'}, status=400)

            if key == 'tags':
                if not all(isinstance(tag, str) for tag in value):
                    return False, JsonResponse({'status': 'error', 'message': 'Each tag must be a string'}, status=400)
            if key == 'children_id':
                if not all(isinstance(cid, int) for cid in value):
                    return False, JsonResponse({'status': 'error', 'message': 'Each children_id must be an integer'}, status=400)
            validated[key] = value
        else:
            validated[key] = None

    return True, validated

# Django template login
@rate_limit
def login_view(request):
    """
    A login page .
    """
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        if username == "admin" and password == "password":
            return HttpResponseRedirect("/")
        else:
            return render(request, "login.html", {"error": "Invalid credentials"})
    return render(request, "login.html")

@ensure_csrf_cookie
def get_csrf(request):
    """
    Returns the CSRF token for the current session.
    """
    return JsonResponse({"status": "success"})

def bookmarks_init_api(request):
    '''
    returns JSON:
    {
        'databaseStatus': {
            'lastUpdated': '2025-04-07T02:06:22.107Z'
        },
        'idToBookmark': {
            0: {
                'bid': 0,
                'url': 'URL',
                'img': 'IMAGE URL',
                'name': 'NAME',
                'tags': ['TAG1', 'TAG2'],
                'starred': true,
                'hidden': false
            },
            ...
        },
        'treeStructure': {
            0: { parent_id: null, children_id: [1, 2, ...] },
            1: { parent_id: 0, children_id: [] },
            ...
        }
    }
    '''
    if request.method == 'GET':
        return JsonResponse({'status': 'error', 'message': 'GET method not allowed'}, status=405)

    account = 'admin'  # TODO: get from request

    user = User.objects.get(account=account)
    bookmarks = user.bookmarks.all()
    tree_structure = user.tree_structure.all()

    idToBookmark = {}
    treeStructure = {}
    for i in range(len(bookmarks)):
        bid = bookmarks[i].bid
        idToBookmark[bid] = {
            'id': bid,
            'url': sanitize_string(bookmarks[i].url),
            'img': sanitize_string(bookmarks[i].img),
            'name': sanitize_string(bookmarks[i].name),
            'tags': sanitize_data(bookmarks[i].tags),
            'starred': bookmarks[i].starred,
            'hidden': bookmarks[i].hidden
        }
        treeStructure[bid] = {
            'parent_id': tree_structure[i].parent_id,
            'children_id': tree_structure[i].children_id
        }

    response_data = {
        'databaseStatus': {
            'lastUpdated': user.lastUpdated
        },
        'idToBookmark': idToBookmark,
        'treeStructure': treeStructure
    }
    return JsonResponse(response_data, safe=False)

def bookmarks_update_api(request, bid):
    '''
    if bid is existing, update the bookmark
    else create a new bookmark

    request body:
        {
            'time': '2025-04-07T02:06:22.107Z',
            'parent_id': 0,
            'children_id': [],
            'url': 'URL',
            'img': 'IMAGE URL',
            'name': 'NAME',
            'tags': ['TAG1', 'TAG2'],
            'starred': true,
            'hidden': false
        }

    returns JSON: 
        {'status': 'success'}
    '''
    if request.method == 'GET':
        return JsonResponse({'status': 'error', 'message': 'GET method not allowed'}, status=405)

    # check json
    try:
        request_data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)

    account = 'admin'  # TODO: get from request
    request_data = json.loads(request.body)

    time = request_data.get('time')
    if time is None:  # time is required
        return JsonResponse({'status': 'error', 'message': 'missing time'}, status=400)
    parent_id = request_data.get('parent_id')
    children_id = request_data.get('children_id')
    url = sanitize_string(request_data.get('url'))
    img = sanitize_string(request_data.get('img'))
    name = sanitize_string(request_data.get('name'))
    tags = sanitize_data(request_data.get('tags'))
    starred = request_data.get('starred')
    hidden = request_data.get('hidden')

    user = User.objects.get(account=account)
    bookmark = Bookmarks.objects.filter(account=user.account, bid=bid)
    tree_structure = TreeStructure.objects.filter(account=user.account, bid=bid)

    # verify the validity of the data
    is_new = (len(bookmark) == 0)
    is_valid, validated = validate_bookmark_request(request_data, require_all_fields=is_new)
    if not is_valid:
        return validated
    
    if len(bookmark) == 0:  # create a new bookmark
        # all perperties are required
        for prop in [parent_id, children_id, url, img, name, tags, starred, hidden]:
            if prop is None:
                return JsonResponse({'status': 'error', 'message': 'missing properties'}, status=400)

        bookmark = Bookmarks(
            account=user,
            bid=bid,
            url=url,
            img=img,
            name=name,
            tags=tags,
            starred=starred,
            hidden=hidden
        )
        tree_structure = TreeStructure(
            account=user,
            bid=bookmark,
            parent_id=parent_id,
            children_id=children_id
        )
        user.lastUpdated = time

        bookmark.save()
        tree_structure.save()
        user.save()
    else: # update the existing bookmark
        bookmark = bookmark[0]
        tree_structure = tree_structure[0]

        tree_structure.parent_id = parent_id if parent_id is not None else tree_structure.parent_id
        tree_structure.children_id = children_id if children_id is not None else tree_structure.children_id
        bookmark.url = url if url is not None else bookmark.url
        bookmark.img = img if img is not None else bookmark.img
        bookmark.name = name if name is not None else bookmark.name
        bookmark.tags = tags if tags is not None else bookmark.tags
        bookmark.starred = starred if starred is not None else bookmark.starred
        bookmark.hidden = hidden if hidden is not None else bookmark.hidden
        user.lastUpdated = time

        bookmark.save()
        tree_structure.save()
        user.save()

    return JsonResponse({'status': 'success'}, status=200)

def bookmarks_delete_api(request, bid):
    '''
    delete the bookmark with bid

    request body:
        {
            'time': '2025-04-07T02:06:22.107Z'
        }

    returns JSON: 
        {'status': 'success'}
    '''
    if request.method == 'GET':
        return JsonResponse({'status': 'error', 'message': 'GET method not allowed'}, status=405)

    account = 'admin'  # TODO: get from request

    user = User.objects.get(account=account)
    bookmark = Bookmarks.objects.filter(account=user.account, bid=bid)
    if len(bookmark) == 0:
        return JsonResponse({'status': 'error', 'message': 'bookmark not found'}, status=404)
    try:
        request_data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    time = request_data.get('time')
    if time is None:  # time is required
        return JsonResponse({'status': 'error', 'message': 'missing time'}, status=400)

    bookmark[0].delete()
    user.lastUpdated = time

    user.save()

    return JsonResponse({'status': 'success'}, status=200)