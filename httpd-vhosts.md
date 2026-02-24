# Virtual Hosts
#
# Required modules: mod_log_config

# If you want to maintain multiple domains/hostnames on your
# machine you can setup VirtualHost containers for them. Most configurations
# use only name-based virtual hosts so the server doesn't need to worry about
# IP addresses. This is indicated by the asterisks in the directives below.
#
# Please see the documentation at
# <URL:http://httpd.apache.org/docs/2.4/vhosts/>
# for further details before you try to setup virtual hosts.
#
# You may use the command line option '-S' to verify your virtual host
# configuration.

#
# Use name-based virtual hosting.
#
##NameVirtualHost *:80
#
# VirtualHost example:
# Almost any Apache directive may go into a VirtualHost container.
# The first VirtualHost section is used for all requests that do not
# match a ##ServerName or ##ServerAlias in any <VirtualHost> block.
#

##<VirtualHost *:80>
    ##ServerAdmin webmaster@dummy-host2.example.com
    ##DocumentRoot "C:/xampp/htdocs/dummy-host2.example.com"
    ##ServerName dummy-host2.example.com
    ##ErrorLog "logs/dummy-host2.example.com-error.log"
    ##CustomLog "logs/dummy-host2.example.com-access.log" common
##</VirtualHost>

# Virtual Host untuk IT Helpdesk dengan FleetCore Reverse Proxy
<VirtualHost *:8086>
    #DocumentRoot "C:/xampp/htdocs/it-helpdesk"
    #ServerName it-helpdesk.indovisual.co.id

    #<Directory "C:/xampp/htdocs/it-helpdesk">
        #Options Indexes FollowSymLinks
        #AllowOverride All
        #Require all granted
    #</Directory>

    # ========================================
    # FleetCore Reverse Proxy Configuration
    # ========================================
    # Enable proxy modules (pastikan sudah diaktifkan di httpd.conf):
    # LoadModule proxy_module modules/mod_proxy.so
    # LoadModule proxy_http_module modules/mod_proxy_http.so
    # LoadModule headers_module modules/mod_headers.so

    # FleetCore Reverse Proxy untuk subpath /fleetcore
    ProxyPreserveHost On
    ProxyRequests Off

    # Proxy semua request ke /fleetcore ke Node.js server di port 3001
    ProxyPass "/fleetcore" "http://127.0.0.1:3001/fleetcore"
    ProxyPassReverse "/fleetcore" "http://127.0.0.1:3001/fleetcore"

    # Proxy untuk _next static assets
    ProxyPass "/fleetcore/_next" "http://127.0.0.1:3001/fleetcore/_next"
    ProxyPassReverse "/fleetcore/_next" "http://127.0.0.1:3001/fleetcore/_next"

    # Proxy untuk API routes
    ProxyPass "/fleetcore/api" "http://127.0.0.1:3001/fleetcore/api"
    ProxyPassReverse "/fleetcore/api" "http://127.0.0.1:3001/fleetcore/api"

    # ========================================
    # Portal Reverse Proxy Configuration
    # Serve this Next.js app under /portal -> local port 3003
    # (Ensure NEXT_PUBLIC_BASE_PATH=/portal used at build time)
    # ========================================
    ProxyPass        "/portal" "http://127.0.0.1:3003/portal" retry=0 timeout=5
    ProxyPassReverse "/portal" "http://127.0.0.1:3003/portal"

    # static/_next assets for portal
    ProxyPass        "/portal/_next/" "http://127.0.0.1:3003/portal/_next/"
    ProxyPassReverse "/portal/_next/" "http://127.0.0.1:3003/portal/_next/"

    # Optional API routes if used by the portal
    ProxyPass        "/portal/api/" "http://127.0.0.1:3003/portal/api/"
    ProxyPassReverse "/portal/api/" "http://127.0.0.1:3003/portal/api/"

    # Headers untuk mendukung WebSocket dan proper forwarding
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "8086"
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s

    # Timeout settings
    ProxyTimeout 300
    ProxyBadHeader Ignore

    # ========================================
    # FormFlow Reverse Proxy Configuration
    # ========================================
    # FleetCore Reverse Proxy untuk subpath /fleetcore
    ProxyPreserveHost On
    ProxyRequests Off

    # static/_next assets for portal
    ProxyPass        "/formflow/_next/" "http://127.0.0.1:3002/formflow/_next/"
    ProxyPassReverse "/formflow/_next/" "http://127.0.0.1:3002/formflow/_next/"

    # ========================================
    # SSE / Presence optimizations for FormFlow
    # - Prevent buffering and compression that can break chunked SSE
    # - Increase timeouts and force packet flushing for reliable long-lived connections
    # NOTE: Place these BEFORE the generic /formflow/api/ ProxyPass rules.
    # ========================================
    ProxyPass        "/formflow/api/presence/" "http://127.0.0.1:3002/formflow/api/presence/" timeout=86400 disablereuse=On flushpackets=on
    ProxyPassReverse "/formflow/api/presence/" "http://127.0.0.1:3002/formflow/api/presence/"
    ProxyPass        "/formflow/api/presence/subscribe" "http://127.0.0.1:3002/formflow/api/presence/subscribe" timeout=86400 disablereuse=On flushpackets=on
    ProxyPassReverse "/formflow/api/presence/subscribe" "http://127.0.0.1:3002/formflow/api/presence/subscribe"
    ProxyPass        "/formflow/api/presence/subscribe-user" "http://127.0.0.1:3002/formflow/api/presence/subscribe-user" timeout=86400 disablereuse=On flushpackets=on
    ProxyPassReverse "/formflow/api/presence/subscribe-user" "http://127.0.0.1:3002/formflow/api/presence/subscribe-user"

    # Don't compress SSE responses and remove Accept-Encoding to avoid backend compression
    <LocationMatch "^/formflow/api/presence">
        SetEnvIf Request_URI "^/formflow/api/presence" no-gzip=1
        RequestHeader unset Accept-Encoding
    </LocationMatch>

    # Generous proxy timeout for long-lived connections (must exceed server heartbeat)
    ProxyTimeout 86400
    # Forward the application base path so backend can derive proper base URLs if needed
    RequestHeader set X-Forwarded-Prefix "/formflow"

    # Root app route should be defined AFTER the more specific SSE/API rules.
    ProxyPass        "/formflow" "http://127.0.0.1:3002/formflow" retry=0 timeout=5
    ProxyPassReverse "/formflow" "http://127.0.0.1:3002/formflow"

    # Optional API routes if used by the portal
    ProxyPass        "/formflow/api/" "http://127.0.0.1:3002/formflow/api/"
    ProxyPassReverse "/formflow/api/" "http://127.0.0.1:3002/formflow/api/"
    # Headers untuk mendukung WebSocket dan proper forwarding
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "8086"
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s
    ProxyPass        "/formflow/_next/webpack-hmr"  "ws://127.0.0.1:3002/formflow/_next/webpack-hmr"
    ProxyPassReverse "/formflow/_next/webpack-hmr"  "ws://127.0.0.1:3002/formflow/_next/webpack-hmr"

</VirtualHost>

# Virtual Host untuk IT Helpdesk (SSL/HTTPS di Port 443) dengan FleetCore Reverse Proxy
<VirtualHost *:4433>
    #DocumentRoot "C:/xampp/htdocs/it-helpdesk"
    #ServerName it-helpdesk.indovisual.co.id

    # Aktifkan Mesin SSL
    #SSLEngine on

    # Gunakan sertifikat "dummy" bawaan XAMPP untuk tes
    #SSLCertificateFile "conf/ssl.crt/server.crt"
    #SSLCertificateKeyFile "conf/ssl.key/server.key"

    #<Directory "C:/xampp/htdocs/it-helpdesk">
        #Options Indexes FollowSymLinks
        #AllowOverride All
        #Require all granted
    #</Directory>

    # ========================================
    # FleetCore Reverse Proxy Configuration (HTTPS)
    # ========================================
    # FleetCore Reverse Proxy untuk HTTPS
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass "/fleetcore" "http://127.0.0.1:3001/fleetcore"
    ProxyPassReverse "/fleetcore" "http://127.0.0.1:3001/fleetcore"
    ProxyPass "/fleetcore/_next" "http://127.0.0.1:3001/fleetcore/_next"
    ProxyPassReverse "/fleetcore/_next" "http://127.0.0.1:3001/fleetcore/_next"
    ProxyPass "/fleetcore/api" "http://127.0.0.1:3001/fleetcore/api"
    ProxyPassReverse "/fleetcore/api" "http://127.0.0.1:3001/fleetcore/api"
    ProxyPass "/fleetcore/uploads" "http://127.0.0.1:3001/fleetcore/uploads"
    ProxyPassReverse "/fleetcore/uploads" "http://127.0.0.1:3001/fleetcore/uploads"
    
    # ========================================
    # Portal Reverse Proxy Configuration (HTTPS)
    # Mirror the HTTP rules above so /portal works on HTTPS vhost too
    # ========================================
    ProxyPass        "/portal" "http://127.0.0.1:3003/portal" retry=0 timeout=5
    ProxyPassReverse "/portal" "http://127.0.0.1:3003/portal"
    ProxyPass        "/portal/_next/" "http://127.0.0.1:3003/portal/_next/"
    ProxyPassReverse "/portal/_next/" "http://127.0.0.1:3003/portal/_next/"
    ProxyPass        "/portal/api/" "http://127.0.0.1:3003/portal/api/"
    ProxyPassReverse "/portal/api/" "http://127.0.0.1:3003/portal/api/"
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "4433"
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s
    ProxyTimeout 300
    ProxyBadHeader Ignore

    # ========================================
    # FormFlow Reverse Proxy Configuration (HTTPS)
    # ========================================
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass        "/formflow/_next/" "http://127.0.0.1:3002/formflow/_next/"
    ProxyPassReverse "/formflow/_next/" "http://127.0.0.1:3002/formflow/_next/"

    # ========================================
    # SSE / Presence optimizations for FormFlow (HTTPS)
    # ========================================
    ProxyPass        "/formflow/api/presence/" "http://127.0.0.1:3002/formflow/api/presence/" timeout=86400 disablereuse=On flushpackets=on
    ProxyPassReverse "/formflow/api/presence/" "http://127.0.0.1:3002/formflow/api/presence/"
    ProxyPass        "/formflow/api/presence/subscribe" "http://127.0.0.1:3002/formflow/api/presence/subscribe" timeout=86400 disablereuse=On flushpackets=on
    ProxyPassReverse "/formflow/api/presence/subscribe" "http://127.0.0.1:3002/formflow/api/presence/subscribe"
    ProxyPass        "/formflow/api/presence/subscribe-user" "http://127.0.0.1:3002/formflow/api/presence/subscribe-user" timeout=86400 disablereuse=On flushpackets=on
    ProxyPassReverse "/formflow/api/presence/subscribe-user" "http://127.0.0.1:3002/formflow/api/presence/subscribe-user"

    <LocationMatch "^/formflow/api/presence">
        SetEnvIf Request_URI "^/formflow/api/presence" no-gzip=1
        RequestHeader unset Accept-Encoding
    </LocationMatch>

    ProxyTimeout 86400
    RequestHeader set X-Forwarded-Prefix "/formflow"

    ProxyPass        "/formflow/api/" "http://127.0.0.1:3002/formflow/api/"
    ProxyPassReverse "/formflow/api/" "http://127.0.0.1:3002/formflow/api/"
    ProxyPass        "/formflow" "http://127.0.0.1:3002/formflow" retry=0 timeout=5
    ProxyPassReverse "/formflow" "http://127.0.0.1:3002/formflow"
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "4433"
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s
    ProxyTimeout 300
    ProxyBadHeader Ignore

</VirtualHost>

# -----------------------------------------------------------------------------
# VirtualHost for portalivp.indovisual.co.id (HTTP)
# -----------------------------------------------------------------------------
<VirtualHost *:8086>
    ServerName portalivp.indovisual.co.id

    # If you want the site available using the bare IP as well, add a ServerAlias
    # ServerAlias 103.157.191.102

    ProxyPreserveHost On
    ProxyRequests Off

    # Proxy root to the Next.js app running on port 3003
    ProxyPass        "/" "http://127.0.0.1:3003/" retry=0 timeout=5
    ProxyPassReverse "/" "http://127.0.0.1:3003/"

    # Ensure _next static files and API routes are proxied correctly
    ProxyPass        "/_next/" "http://127.0.0.1:3003/_next/"
    ProxyPassReverse "/_next/" "http://127.0.0.1:3003/_next/"
    ProxyPass        "/api/" "http://127.0.0.1:3003/api/"
    ProxyPassReverse "/api/" "http://127.0.0.1:3003/api/"

    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "8086"
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s

    ErrorLog "logs/portalivp-http-error.log"
    CustomLog "logs/portalivp-http-access.log" common
</VirtualHost>

# -----------------------------------------------------------------------------
# VirtualHost for portalivp.indovisual.co.id (HTTPS)
# -----------------------------------------------------------------------------
<VirtualHost *:4433>
    ServerName portalivp.indovisual.co.id

    # SSL configuration (replace with your real certs)
    #SSLEngine on
    #SSLCertificateFile "conf/ssl.crt/portalivp.crt"
    #SSLCertificateKeyFile "conf/ssl.key/portalivp.key"

    ProxyPreserveHost On
    ProxyRequests Off

    ProxyPass        "/" "http://127.0.0.1:3003/" retry=0 timeout=5
    ProxyPassReverse "/" "http://127.0.0.1:3003/"
    ProxyPass        "/_next/" "http://127.0.0.1:3003/_next/"
    ProxyPassReverse "/_next/" "http://127.0.0.1:3003/_next/"
    ProxyPass        "/api/" "http://127.0.0.1:3003/api/"
    ProxyPassReverse "/api/" "http://127.0.0.1:3003/api/"

    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "4433"
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s

    ErrorLog "logs/portalivp-https-error.log"
    CustomLog "logs/portalivp-https-access.log" common
</VirtualHost>

# -----------------------------------------------------------------------------
# Also listen on port 80 so the bare hostname (no port) routes to the app
# This prevents default XAMPP dashboard from answering for portalivp.indovisual.co.id
# -----------------------------------------------------------------------------
<VirtualHost *:80>
    ServerName portalivp.indovisual.co.id

    # Optional ServerAlias for www
    ServerAlias www.portalivp.indovisual.co.id

    ProxyPreserveHost On
    ProxyRequests Off

    # Allow Let's Encrypt http-01 validation to be served locally
    # -- ensure this location is served by Apache (not proxied to the Next.js app)
    # Put challenge files in C:/xampp/htdocs/.well-known/acme-challenge
    # Ordering matters: exclude the path from proxying using ProxyPass "!" before the
    # generic ProxyPass "/" which forwards to the Next.js app.
    ProxyPass "/.well-known/acme-challenge/" "!"
    Alias "/.well-known/acme-challenge/" "C:/xampp/htdocs/.well-known/acme-challenge/"
    <Directory "C:/xampp/htdocs/.well-known/acme-challenge/">
        Require all granted
        Options None
    </Directory>

    # Proxy the root path to Next.js on 127.0.0.1:3003
    ProxyPass        "/" "http://127.0.0.1:3003/" retry=0 timeout=5
    ProxyPassReverse "/" "http://127.0.0.1:3003/"

    ProxyPass        "/_next/" "http://127.0.0.1:3003/_next/"
    ProxyPassReverse "/_next/" "http://127.0.0.1:3003/_next/"
    ProxyPass        "/api/" "http://127.0.0.1:3003/api/"
    ProxyPassReverse "/api/" "http://127.0.0.1:3003/api/"

    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s

    ErrorLog "logs/portalivp-80-error.log"
    CustomLog "logs/portalivp-80-access.log" common
</VirtualHost>

# -----------------------------------------------------------------------------
# VirtualHost for portalivp.indovisual.co.id (HTTPS standard port 443)
# This ensures requests to https://portalivp.indovisual.co.id (default port 443)
# are routed to the Next.js app instead of the XAMPP dashboard.
# Replace certificate paths with the real certificate files issued for the domain.
# -----------------------------------------------------------------------------
#<VirtualHost *:443>
    #ServerName portalivp.indovisual.co.id
    #ServerAlias www.portalivp.indovisual.co.id

    #SSLEngine on
    # Replace these with your real certificate paths (generated by win-acme or other CA)
    # win-acme common/pem output locations (recommended):
    #   C:\xampp\apache\conf\ssl\portalivp-fullchain.pem
    #   C:\xampp\apache\conf\ssl\portalivp-privkey.pem
    # If you use the older CRT/KEY layout in XAMPP, create copies or symlinks as:
    #   conf/ssl.crt/portalivp.crt   (PEM/fullchain)
    #   conf/ssl.key/portalivp.key   (private key)
    # Example - use fullchain / privkey created by win-acme (PEM form):
    # SSLCertificateFile "conf/ssl/portalivp-fullchain.pem"
    # SSLCertificateKeyFile "conf/ssl/portalivp-privkey.pem"
    # Or point to the CRT / KEY paths if you copied them to the XAMPP folders:
    #SSLCertificateFile "conf/ssl.crt/portalivp.crt"
    #SSLCertificateKeyFile "conf/ssl.key/portalivp.key"
    # Optional chain file
    # SSLCertificateChainFile "conf/ssl.crt/portalivp-chain.pem"

    #ProxyPreserveHost On
    #ProxyRequests Off

    #ProxyPass        "/" "http://127.0.0.1:3003/" retry=0 timeout=5
    #ProxyPassReverse "/" "http://127.0.0.1:3003/"
    #ProxyPass        "/_next/" "http://127.0.0.1:3003/_next/"
    #ProxyPassReverse "/_next/" "http://127.0.0.1:3003/_next/"
    #ProxyPass        "/api/" "http://127.0.0.1:3003/api/"
    #ProxyPassReverse "/api/" "http://127.0.0.1:3003/api/"

    #RequestHeader set X-Forwarded-Proto "https"
    #RequestHeader set X-Forwarded-Port "443"
    #RequestHeader set X-Real-IP %{REMOTE_ADDR}s

    #ErrorLog "logs/portalivp-443-error.log"
    #CustomLog "logs/portalivp-443-access.log" common
#</VirtualHost>