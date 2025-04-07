from django.contrib import admin
from .models import Bookmarks, DatabaseStatus

# Register your models here.
admin.site.register(Bookmarks)
admin.site.register(DatabaseStatus)