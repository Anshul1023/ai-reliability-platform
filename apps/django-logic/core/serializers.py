"""Django REST Framework serializers."""
from rest_framework import serializers
from .models import (
    Project, Service, Deployment, Incident,
    IncidentEvent, AgentRun, ProjectData, User
)


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


class DeploymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deployment
        fields = '__all__'


class IncidentEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentEvent
        fields = '__all__'


class AgentRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentRun
        fields = '__all__'


class ProjectDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectData
        fields = '__all__'


class IncidentSerializer(serializers.ModelSerializer):
    events = IncidentEventSerializer(many=True, read_only=True)
    agent_runs = AgentRunSerializer(many=True, read_only=True)

    class Meta:
        model = Incident
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    deployments = DeploymentSerializer(many=True, read_only=True)
    incidents = IncidentSerializer(many=True, read_only=True)
    data = ProjectDataSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8)
    name = serializers.CharField(required=False, allow_blank=True)


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
