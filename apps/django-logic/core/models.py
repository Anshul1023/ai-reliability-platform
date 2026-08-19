"""Django models for business logic layer."""
from django.db import models
from django.utils import timezone


class Project(models.Model):
    """Project model - mirrors the FastAPI Project model."""
    name = models.CharField(max_length=255)
    repo = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=50, default='Healthy')
    uptime = models.FloatField(default=99.99)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name


class Service(models.Model):
    """Service model - monitors external services."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='Healthy')
    latency_ms = models.FloatField(default=0)
    uptime = models.FloatField(default=99.99)
    check_url = models.URLField(blank=True, null=True)
    last_checked = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.project.name} - {self.name}"


class Deployment(models.Model):
    """Deployment model - tracks deployments from GitHub."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='deployments')
    sha = models.CharField(max_length=40)
    message = models.TextField(blank=True)
    author = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project.name} - {self.sha[:7]}"


class Incident(models.Model):
    """Incident model - tracks production incidents."""
    SEVERITY_CHOICES = [
        ('Critical', 'Critical'),
        ('Warning', 'Warning'),
        ('Info', 'Info'),
    ]
    STATUS_CHOICES = [
        ('Investigating', 'Investigating'),
        ('Identified', 'Identified'),
        ('Monitoring', 'Monitoring'),
        ('Resolved', 'Resolved'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='incidents')
    title = models.CharField(max_length=255)
    service = models.CharField(max_length=255, blank=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='Warning')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Investigating')
    confidence = models.IntegerField(default=0)
    summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project.name} - {self.title}"


class IncidentEvent(models.Model):
    """Incident event model - timeline of incident actions."""
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=50)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.incident.title} - {self.event_type}"


class AgentRun(models.Model):
    """Agent run model - AI investigation results."""
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='agent_runs')
    status = models.CharField(max_length=50, default='pending')
    confidence = models.IntegerField(default=0)
    result = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Investigation for {self.incident.title}"


class ProjectData(models.Model):
    """Project data model - stores JSON documents for RAG."""
    DATA_TYPE_CHOICES = [
        ('repository', 'Repository'),
        ('readme', 'README'),
        ('files', 'Files'),
        ('services', 'Services'),
        ('incidents', 'Incidents'),
        ('tech', 'Tech Stack'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='data')
    data_type = models.CharField(max_length=50, choices=DATA_TYPE_CHOICES)
    payload = models.JSONField(default=dict)
    source = models.CharField(max_length=50, default='github')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']
        unique_together = ['project', 'data_type']

    def __str__(self):
        return f"{self.project.name} - {self.data_type}"


class User(models.Model):
    """User model for authentication."""
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=20, default='user')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.email
