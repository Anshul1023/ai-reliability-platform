"""Django URL configuration for core app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet)
router.register(r'services', views.ServiceViewSet)
router.register(r'deployments', views.DeploymentViewSet)
router.register(r'incidents', views.IncidentViewSet)
router.register(r'project-data', views.ProjectDataViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('health/', views.health_check, name='health'),
    path('projects/sync/', views.sync_projects, name='sync-projects'),
    path('projects/<int:project_id>/refresh/', views.refresh_project_data, name='refresh-project'),
]
