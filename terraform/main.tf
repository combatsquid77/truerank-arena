terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# 1. Secure Resource Group in West Central US
resource "azurerm_resource_group" "rg" {
  name     = "rg-truerank-prod"
  location = "westcentralus"
}

# 2. Service Plan (B1 Linux Tier)
resource "azurerm_service_plan" "plan" {
  name                = "plan-truerank"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "B1" # Burstable basic tier (~$12/mo)
}

# 3. Random suffix for unique namespace
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# 4. Hardened Linux Web App (Node 20 Runtime)
resource "azurerm_linux_web_app" "app" {
  name                = "app-truerank-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.plan.id

  # --- SECURITY HARDENING SETTINGS ---
  https_only = true # Force HTTPS redirection for all HTTP traffic

  site_config {
    always_on           = true
    minimum_tls_version = "1.2"      # Reject legacy, weak SSL/TLS protocols
    ftps_state          = "Disabled" # Disable FTP/FTPS deployment interfaces to prevent credential leaks

    application_stack {
      node_version = "20-lts"
    }
    
    # Boot command: starts our packaged server bundle
    app_command_line = "node dist/server.cjs"
    
    # CORS Protection: restrict browser requests strictly to truerank.uk domain
    cors {
      allowed_origins     = ["https://truerank.uk", "https://www.truerank.uk"]
      support_credentials = false
    }
  }

  # System-Assigned Managed Identity: securely authenticate with Azure resources (databases, vaults) passwordlessly
  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    "NODE_ENV"                       = "production"
    "PORT"                           = "8080"
    "DATABASE_URL"                   = "file:/home/data/dev.db"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "false"
  }
}

# Output findings
output "app_url" {
  value = "https://${azurerm_linux_web_app.app.default_hostname}"
}

output "app_name" {
  value = azurerm_linux_web_app.app.name
}
