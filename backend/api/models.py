from django.db import models

class Bookmarks(models.Model):
    account = models.ForeignKey('User', on_delete=models.CASCADE, related_name='bookmarks')
    bid = models.BigIntegerField(primary_key=True)
    url = models.CharField(max_length=2000)
    img = models.CharField(max_length=500, blank=True)
    name = models.CharField(max_length=200)
    tags = models.JSONField(default=list, blank=True)
    starred = models.BooleanField(default=False)
    hidden = models.BooleanField(default=False)
    class Meta:
        db_table = 'api_bookmarks_new'

class TreeStructure(models.Model):
    account = models.ForeignKey('User', on_delete=models.CASCADE, related_name='tree_structure')
    bid = models.ForeignKey('Bookmarks', on_delete=models.CASCADE, related_name='tree_structure')
    parent_id = models.BigIntegerField(default=None, null=True, blank=True)  # parent_id can be null
    children_id = models.JSONField(default=list, blank=True)

class User(models.Model):
    account = models.EmailField(primary_key=True, max_length=254)
    name = models.CharField(max_length=200)
    picture = models.URLField(blank=True)
    password = models.CharField(max_length=200, blank=True, null=True)
    lastUpdated = models.DateTimeField(auto_now=True)