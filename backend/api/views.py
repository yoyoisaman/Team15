from django.http import JsonResponse, HttpResponseRedirect
from .models import Bookmarks, TreeStructure, User
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

import json


# Django template loging
def login_view(request):
    """
    A simple login page for practice.
    """
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        if username == "admin" and password == "password":
            return HttpResponseRedirect("/sample-template/")
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
            'url': bookmarks[i].url,
            'img': bookmarks[i].img,
            'name': bookmarks[i].name,
            'tags': bookmarks[i].tags,
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

    
    account = 'admin'  # TODO: get from request
    request_data = json.loads(request.body)

    time = request_data.get('time')
    if time is None:  # time is required
        return JsonResponse({'status': 'error', 'message': 'missing time'}, status=400)
    parent_id = request_data.get('parent_id')
    children_id = request_data.get('children_id')
    url = request_data.get('url')
    img = request_data.get('img')
    name = request_data.get('name')
    tags = request_data.get('tags')
    starred = request_data.get('starred')
    hidden = request_data.get('hidden')

    user = User.objects.get(account=account)
    bookmark = Bookmarks.objects.filter(account=user.account, bid=bid)
    tree_structure = TreeStructure.objects.filter(account=user.account, bid=bid)
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
            children_id=[]
        )
        user.lastUpdated = time

        bookmark.save()
        tree_structure.save()
        user.save()
    else: # update the existing bookmark
        bookmark = bookmark[0]
        tree_structure = tree_structure[0]

        tree_structure.parent_id = parent_id if parent_id is not None else tree_structure.parent_id
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
    
    time = json.loads(request.body).get('time')
    if time is None:  # time is required
        return JsonResponse({'status': 'error', 'message': 'missing time'}, status=400)

    bookmark[0].delete()
    user.lastUpdated = time

    user.save()

    return JsonResponse({'status': 'success'}, status=200)