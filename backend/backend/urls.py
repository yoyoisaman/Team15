"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from api.views import get_csrf, bookmarks_init_api, bookmarks_update_api, bookmarks_delete_api, login_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/get_csrf', get_csrf, name='get_csrf'),
    path('api/bookmarks/init', bookmarks_init_api, name='bookmarks_init_api'),
    path('api/bookmarks/update/<int:bid>', bookmarks_update_api, name='bookmarks_update_api'),
    path('api/bookmarks/delete/<int:bid>', bookmarks_delete_api, name='bookmarks_delete_api'),
    path('login/', login_view, name='login'),
]
