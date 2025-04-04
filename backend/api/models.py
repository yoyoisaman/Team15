from django.db import models

# Create your models here.
class Bookmarks(models.Model):
    bid = models.IntegerField(primary_key=True)
    url = models.CharField(max_length=2000)
    img = models.CharField(max_length=500, blank=True)
    name = models.CharField(max_length=200)
    tags = models.JSONField(default=list, blank=True)
    starred = models.BooleanField(default=False)
    hidden = models.BooleanField(default=False)
    parent_id = models.IntegerField(default=None, null=True, blank=True)  # parent_id can be null
    children_id = models.JSONField(default=list, blank=True)