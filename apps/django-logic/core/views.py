"""Django views for business logic."""
import hashlib
import secrets
from datetime import datetime, timezone

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password, check_password

from .models import (
    Project, Service, Deployment, Incident,
    IncidentEvent, AgentRun, ProjectData, User
)
from .serializers import (
    ProjectSerializer, ServiceSerializer, DeploymentSerializer,
    IncidentSerializer, IncidentEventSerializer, AgentRunSerializer,
    ProjectDataSerializer, UserSerializer, UserCreateSerializer,
    UserLoginSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    """Project CRUD operations."""
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Project.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get project summary with counts."""
        project = self.get_object()
        return Response({
            'id': project.id,
            'name': project.name,
            'repo': project.repo,
            'status': project.status,
            'uptime': project.uptime,
            'services_count': project.services.count(),
            'deployments_count': project.deployments.count(),
            'incidents_count': project.incidents.count(),
        })


class ServiceViewSet(viewsets.ModelViewSet):
    """Service CRUD operations."""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Service.objects.all()
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset


class DeploymentViewSet(viewsets.ModelViewSet):
    """Deployment CRUD operations."""
    queryset = Deployment.objects.all()
    serializer_class = DeploymentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Deployment.objects.all()
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset


class IncidentViewSet(viewsets.ModelViewSet):
    """Incident CRUD operations."""
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Incident.objects.all()
        project_id = self.request.query_params.get('project_id')
        severity = self.request.query_params.get('severity')
        status_filter = self.request.query_params.get('status')
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if severity:
            queryset = queryset.filter(severity=severity)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=['post'])
    def investigate(self, request, pk=None):
        """Trigger AI investigation for an incident."""
        incident = self.get_object()
        # Create agent run
        agent_run = AgentRun.objects.create(
            incident=incident,
            status='running',
            confidence=0,
            result={'message': 'Investigation started'}
        )
        return Response({
            'incident_id': incident.id,
            'agent_run_id': agent_run.id,
            'status': 'started'
        })


class ProjectDataViewSet(viewsets.ModelViewSet):
    """Project data CRUD operations."""
    queryset = ProjectData.objects.all()
    serializer_class = ProjectDataSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = ProjectData.objects.all()
        project_id = self.request.query_params.get('project_id')
        data_type = self.request.query_params.get('data_type')
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if data_type:
            queryset = queryset.filter(data_type=data_type)
        return queryset


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user."""
    serializer = UserCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    name = serializer.validated_data.get('name', '')
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already registered'},
            status=status.HTTP_409_CONFLICT
        )
    
    user = User.objects.create(
        email=email,
        name=name,
        password_hash=make_password(password),
        role='admin' if User.objects.count() == 0 else 'user'
    )
    
    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login user and return tokens."""
    serializer = UserLoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not check_password(password, user.password_hash):
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    return Response(UserSerializer(user).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint."""
    return Response({'status': 'ok', 'service': 'django-logic'})


@api_view(['POST'])
@permission_classes([AllowAny])
def sync_projects(request):
    """Sync projects from GitHub."""
    # This would call the GitHub API and sync projects
    # For now, return a placeholder
    return Response({'message': 'Project sync triggered', 'status': 'started'})


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_project_data(request, project_id):
    """Refresh project data from GitHub."""
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response(
            {'error': 'Project not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # This would call GitHub API and refresh project data
    # For now, return a placeholder
    return Response({
        'message': f'Data refresh triggered for {project.name}',
        'status': 'started'
    })
