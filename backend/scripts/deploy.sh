#!/bin/bash

# Nubiago Backend Deployment Script
# This script handles production deployment with Supabase

set -e

echo "🚀 Starting Nubiago Backend Deployment..."

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="nubiago"
SUPABASE_PROJECT_ID="gwcngnbugrfavejmvcnq"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        log_warning "Supabase CLI is not installed. Installing..."
        npm install -g supabase
    fi
    
    # Check if environment file exists
    if [[ ! -f ".env.${ENVIRONMENT}" && ! -f ".env" ]]; then
        log_error "Environment file not found. Please create .env.${ENVIRONMENT} or .env"
        exit 1
    fi
    
    log_success "Prerequisites check completed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    # Copy environment file if needed
    if [[ -f ".env.${ENVIRONMENT}" ]]; then
        cp ".env.${ENVIRONMENT}" .env
        log_success "Environment file copied"
    fi
    
    # Load environment variables
    if [[ -f .env ]]; then
        export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
    fi
    
    log_success "Environment setup completed"
}

# Build application
build_application() {
    log_info "Building application..."
    
    # Install dependencies
    npm ci --only=production
    
    # Build TypeScript
    npm run build
    
    log_success "Application build completed"
}

# Setup Supabase
setup_supabase() {
    log_info "Setting up Supabase..."
    
    # Login to Supabase (if not already logged in)
    if ! supabase projects list &> /dev/null; then
        log_info "Please log in to Supabase..."
        supabase login
    fi
    
    # Link to Supabase project
    if [[ ! -f .supabase/config.toml ]]; then
        log_info "Linking to Supabase project..."
        supabase link --project-ref $SUPABASE_PROJECT_ID
    fi
    
    # Run migrations
    log_info "Running database migrations..."
    supabase db push
    
    # Deploy Edge Functions
    if [[ -d "supabase/functions" ]]; then
        log_info "Deploying Edge Functions..."
        supabase functions deploy place-order
        supabase functions deploy send-order-confirmation
    fi
    
    # Setup storage buckets
    log_info "Setting up storage buckets..."
    node -e "
    const { initializeSupabaseStorage } = require('./dist/config/supabase');
    initializeSupabaseStorage().then(() => {
        console.log('Storage buckets initialized');
        process.exit(0);
    }).catch(err => {
        console.error('Storage setup failed:', err);
        process.exit(1);
    });
    "
    
    log_success "Supabase setup completed"
}

# Setup Docker
setup_docker() {
    log_info "Setting up Docker containers..."
    
    # Stop existing containers
    docker-compose down --remove-orphans
    
    # Pull latest images
    docker-compose pull
    
    # Build and start containers
    docker-compose up -d --build
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Check if services are healthy
    if docker-compose ps | grep -q "unhealthy\|Exit"; then
        log_error "Some services failed to start properly"
        docker-compose logs
        exit 1
    fi
    
    log_success "Docker setup completed"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    local api_url="http://localhost:${PORT:-5000}"
    
    # Check API health
    if curl -f -s "${api_url}/health" > /dev/null; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
        exit 1
    fi
    
    # Check database connection
    if curl -f -s "${api_url}/health/db" > /dev/null; then
        log_success "Database health check passed"
    else
        log_error "Database health check failed"
        exit 1
    fi
    
    # Check Supabase connection
    node -e "
    const { testSupabaseConnection } = require('./dist/config/supabase');
    testSupabaseConnection().then(result => {
        if (result) {
            console.log('✅ Supabase connection check passed');
            process.exit(0);
        } else {
            console.log('❌ Supabase connection check failed');
            process.exit(1);
        }
    }).catch(err => {
        console.error('❌ Supabase connection check failed:', err);
        process.exit(1);
    });
    "
    
    log_success "All health checks passed"
}

# Setup SSL (optional)
setup_ssl() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Setting up SSL..."
        
        # Check if SSL certificates exist
        if [[ -f "/etc/nginx/ssl/cert.pem" && -f "/etc/nginx/ssl/private.key" ]]; then
            log_success "SSL certificates found"
        else
            log_warning "SSL certificates not found. Using HTTP only."
        fi
    fi
}

# Cleanup old resources
cleanup() {
    log_info "Cleaning up old resources..."
    
    # Remove old Docker images
    docker image prune -f
    
    # Remove old logs
    find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Create backup
create_backup() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Creating backup..."
        
        # Backup database
        if [[ -n "$DATABASE_URL" ]]; then
            pg_dump "$DATABASE_URL" > "backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"
            log_success "Database backup created"
        fi
        
        # Backup environment file
        cp .env "backups/env_backup_$(date +%Y%m%d_%H%M%S).env"
        log_success "Environment backup created"
    fi
}

# Display deployment summary
show_summary() {
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "  Environment: $ENVIRONMENT"
    echo "  API URL: http://localhost:${PORT:-5000}"
    echo "  Supabase Project: $SUPABASE_PROJECT_ID"
    echo "  Docker Containers: $(docker-compose ps --services | wc -l)"
    echo ""
    echo "🔗 Useful Links:"
    echo "  API Documentation: http://localhost:${PORT:-5000}/api/docs"
    echo "  Health Check: http://localhost:${PORT:-5000}/health"
    echo "  Supabase Dashboard: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_ID"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Test the API endpoints"
    echo "  2. Configure your frontend to use the new backend"
    echo "  3. Set up monitoring and alerts"
    echo "  4. Configure CI/CD pipeline"
    echo ""
    log_info "Logs are available in: logs/"
    log_info "Use 'docker-compose logs -f' to follow container logs"
}

# Error handler
error_handler() {
    log_error "Deployment failed at step: $1"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  1. Check the logs: docker-compose logs"
    echo "  2. Verify environment variables in .env"
    echo "  3. Ensure Supabase project is properly configured"
    echo "  4. Check if ports are available"
    echo ""
    exit 1
}

# Main deployment flow
main() {
    echo "🚀 Nubiago Backend Deployment"
    echo "Environment: $ENVIRONMENT"
    echo "Started at: $(date)"
    echo ""
    
    # Create logs directory
    mkdir -p logs backups
    
    # Run deployment steps
    check_prerequisites || error_handler "Prerequisites check"
    setup_environment || error_handler "Environment setup"
    build_application || error_handler "Application build"
    setup_supabase || error_handler "Supabase setup"
    setup_docker || error_handler "Docker setup"
    run_health_checks || error_handler "Health checks"
    setup_ssl || error_handler "SSL setup"
    cleanup || error_handler "Cleanup"
    create_backup || error_handler "Backup creation"
    
    show_summary
}

# Handle interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@" 