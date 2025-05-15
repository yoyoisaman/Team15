from django.http import JsonResponse, HttpResponseRedirect
from .models import Bookmarks, TreeStructure, User
from django.shortcuts import render, redirect
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
from django.core.cache import cache
from django.http import HttpResponse
from django.conf import settings
from datetime import datetime, timedelta 
import secrets
from django.core.mail import send_mail
from django.urls import reverse
import requests
import json
import html
import re
import os


password_reset_tokens = {}

def forgot_password(request):
    """處理忘記密碼請求"""
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            # 檢查該郵箱是否存在於資料庫
            user = User.objects.get(account=email)
            
            # 生成一個唯一的令牌
            token = secrets.token_urlsafe(32)
            
            # 存儲令牌和對應的使用者
            password_reset_tokens[token] = {
                'user': user.account,
                'expires': datetime.now() + timedelta(hours=1)  # 令牌有效期為1小時
            }
            
            # 建立重設密碼的連結
            frontend_url = "http://localhost:5174"
            reset_link = f"{frontend_url}/reset-password/{token}/"
            
            # 發送電子郵件
            subject = '重設您的密碼'
            message = f'''
            您好，

            我們收到了重設您密碼的請求。請點擊以下連結來重設密碼：
            
            {reset_link}
            
            此連結將在一小時後失效。如果您並未請求重設密碼，請忽略此郵件。

            NTU Team15網站團隊
            '''
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            return render(request, 'forgot_password.html', {
                'success': '重設密碼的連結已發送到您的郵箱，請查收。(如果沒有收到請檢查垃圾郵件或是重新寄送)'
            })
            
        except User.DoesNotExist:
            return render(request, 'forgot_password.html', {
                'error': '此帳號尚未註冊'
            })
    
    # GET 請求：顯示忘記密碼頁面
    return render(request, 'forgot_password.html')


def reset_password(request, token):
    """處理密碼重設"""
    # 檢查令牌是否有效
    if token not in password_reset_tokens or datetime.now() > password_reset_tokens[token]['expires']:
        return render(request, 'reset_password.html', {
            'error': '密碼重設連結無效或已過期。請重新申請。'
        })
    
    if request.method == 'POST':
        new_pw = request.POST.get('new_password')
        confirm_pw = request.POST.get('confirm_password')
        
        if new_pw != confirm_pw:
            return render(request, 'reset_password.html', {
                'error': '兩次輸入密碼不一致',
                'token': token
            })
        
        # 更新使用者密碼
        username = password_reset_tokens[token]['user']
        user = User.objects.get(account=username)
        user.password = new_pw
        user.save()
        
        # 移除已使用的令牌
        del password_reset_tokens[token]
        
        # 重定向到登入頁面
        return redirect('login')
    
    # GET 請求：顯示重設密碼頁面
    return render(request, 'reset_password.html', {'token': token})

# Request rate limit
def rate_limit(view_func):
    def wrapped_view(request, *args, **kwargs):
        ip = request.META.get('REMOTE_ADDR')
        key = f'rate_limit:{ip}'
        limit = 10  # 每分鐘10次請求
        
        current = cache.get(key, 0)
        if current >= limit:
            return HttpResponse("Too Many Requests", status=429)
        
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

@rate_limit
def login_view(request):
    if request.method == 'POST':
        # 驗證 reCAPTCHA
        recaptcha_response = request.POST.get('g-recaptcha-response')
        recaptcha_data = {
            'secret': settings.RECAPTCHA_SECRETKEY,
            'response': recaptcha_response,
            'remoteip': request.META.get('REMOTE_ADDR')
        }
        r = requests.post(settings.RECAPTCHA_URL, data=recaptcha_data)
        result = r.json()
        if not result.get('success'):
            return render(request, 'login.html', {
                'error': 'reCAPTCHA 驗證失敗',
                'sitekey': settings.RECAPTCHA_SITEKEY
            })

        # 帳號密碼驗證
        username = request.POST.get('username')
        password = request.POST.get('password')
        try:
            user = User.objects.get(account=username, password=password)
            request.session['name'] = user.name
            request.session['username'] = user.account
            request.session['picture'] = user.picture
            request.session['is_authenticated'] = True
            request.session.set_expiry(60 * 60 * 24 * 7)
            return redirect('http://localhost:5174')
        except User.DoesNotExist:
            return render(request, 'login.html', {
                'error': '登入失敗',
                'sitekey': settings.RECAPTCHA_SITEKEY
            })
    
    # GET 請求：正常顯示登入頁
    return render(request, 'login.html', {
        'sitekey': settings.RECAPTCHA_SITEKEY
    })

@require_POST
def logout_view(request):
    request.session.flush()
    return JsonResponse({'status': 'success'})

def oauth2callback(request):
    code = request.GET.get('code')
    token_resp = requests.post(
        'https://oauth2.googleapis.com/token',
        data={
            'code': code,
            'client_id': settings.CLIENT_ID,
            'client_secret': settings.CLIENT_SECRET,
            'redirect_uri': settings.REDIRECT_URI,
            'grant_type': 'authorization_code'
        }
    )
    tokens = token_resp.json()
    access_token = tokens.get('access_token')
    userinfo_resp = requests.get(
        'https://openidconnect.googleapis.com/v1/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    userinfo = userinfo_resp.json()
    email = userinfo.get('email')
    name = userinfo.get('name')
    picture = userinfo.get('picture')

    try:
        existing = User.objects.get(account=email)
        if existing.password:
            return render(request, 'login.html', {
                'error': '此帳號已存在，請使用密碼登入'
            })
    except User.DoesNotExist:
        pass

    user, created = User.objects.update_or_create(
        account=email,
        defaults={'name': name, 'picture': picture, 'password': ''}
    )
    root, bm_created = Bookmarks.objects.get_or_create(
        bid=0,
        account=user,
        defaults={
            'url': '#',
            'img': 'folder.png',
            'name': 'Home',
            'tags': [],
            'starred': False,
            'hidden': False
        }
    )
    tree, ts_created = TreeStructure.objects.update_or_create(
        account=user,
        bid=root,
        defaults={'parent_id': None, 'children_id': []}
    )

    request.session['name'] = name
    request.session['username'] = email
    request.session['picture'] = picture
    request.session['is_authenticated'] = False
    request.session.set_expiry(60 * 60 * 24 * 7)
    return render(request, 'password.html')

def set_password(request):
    if request.method == 'POST':
        new_pw = request.POST.get('new_password')
        confirm_pw = request.POST.get('confirm_password')
        if new_pw != confirm_pw:
            return render(request, 'password.html', {'error': '兩次輸入密碼不一致'})
        username = request.session.get('username')
        user = User.objects.get(account=username)
        user.password = new_pw
        user.save()
        request.session['is_authenticated'] = True
        return redirect('http://localhost:5174')
    return render(request, 'password.html')

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
    
    # 如果 session 過期或未登入（從註冊中跳出），則清除 session
    is_authenticated = request.session.get('is_authenticated', False)
    if not is_authenticated:
        request.session.flush()
    
    account = request.session.get('username', 'admin')
    name = request.session.get('name', 'default')
    picture = request.session.get('picture', '')
    
    user = User.objects.get(account=account)
    bookmarks = user.bookmarks.all()
    tree_structure = user.tree_structure.all()
    lastUpdated = datetime.now()
    
    idToBookmark = {}
    treeStructure = {}
    for i in range(len(bookmarks)):
        bid = bookmarks[i].bid
        idToBookmark[bid] = {
            'id': bid,
            'url': sanitize_string(bookmarks[i].url),
            'img': bookmarks[i].img,
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
            'username': account,
            'name': name,
            'picture': picture,
            'lastUpdated': lastUpdated
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

    account = request.session.get('username', 'admin')
    if account == 'admin':
        return JsonResponse({'status': 'success'}, status=200)
    
    request_data = json.loads(request.body)
    time = request_data.get('time')
    if time is None:  # time is required
        return JsonResponse({'status': 'error', 'message': 'missing time'}, status=400)
    parent_id = request_data.get('parent_id')
    children_id = request_data.get('children_id')
    url = sanitize_string(request_data.get('url'))
    img = request_data.get('img')
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
        
    if parent_id is not None:
        parent_ts = TreeStructure.objects.get(account=user, bid=parent_id)
        children = parent_ts.children_id or []
        children = list(set(children + [bid]))
        parent_ts.children_id = children
        parent_ts.save()
        
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

    account = request.session.get('username', 'admin')
    if account == 'admin':
        return JsonResponse({'status': 'success'}, status=200)

    user = User.objects.get(account=account)
    try:
        ts = TreeStructure.objects.get(account=user, bid=bid)
    except TreeStructure.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'bookmark not found'}, status=404)

    try:
        request_data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)

    time = request_data.get('time')
    if time is None:
        return JsonResponse({'status': 'error', 'message': 'missing time'}, status=400)

    parent_id = ts.parent_id
    if parent_id is not None:
        try:
            parent_ts = TreeStructure.objects.get(account=user, bid=parent_id)
            children = parent_ts.children_id or []
            if bid in children:
                children.remove(bid)
                parent_ts.children_id = children
                parent_ts.save()
                print("Updated parent", parent_id, "children_id to:", parent_ts.children_id)
        except TreeStructure.DoesNotExist:
            pass
    ts.delete()
    Bookmarks.objects.filter(account=user, bid=bid).delete()
    user.lastUpdated = time
    user.save()
    return JsonResponse({'status': 'success'}, status=200)