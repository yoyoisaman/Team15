from django.contrib import admin
from .models import Bookmarks, TreeStructure, User

# Register your models here.
admin.site.register(Bookmarks)
admin.site.register(TreeStructure)
admin.site.register(User)