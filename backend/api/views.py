from django.http import JsonResponse
from .models import Bookmarks, DatabaseStatus
import json

# Create your views here.
def bookmarks_api(request):
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
    data = list(Bookmarks.objects.values())
    databaseStatus = DatabaseStatus.objects.last()
    idToBookmark = {}
    treeStructure = {}

    for item in data:
        bid = item['bid']
        idToBookmark[bid] = {
            'id': bid,
            'url': item['url'],
            'img': item['img'],
            'name': item['name'],
            'tags': item['tags'],
            'starred': item['starred'],
            'hidden': item['hidden']
        }
        treeStructure[bid] = {
            'parent_id': item['parent_id'],
            'children_id': item['children_id']
        }

    response_data = {
        'databaseStatus': {
            'lastUpdated': databaseStatus.lastUpdated
        },
        'idToBookmark': idToBookmark,
        'treeStructure': treeStructure
    }
    return JsonResponse(response_data, safe=False)

