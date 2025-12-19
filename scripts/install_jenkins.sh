#!/bin/bash
# ==========================================================================
# FOODHUB DEVSECOPS - ENTERPRISE BOOTSTRAP SCRIPT (HEADLESS OPTIMIZED)
# Tối ưu hóa cho: Ubuntu 24.04/22.04 LTS + IAM Instance Profile
# Sửa lỗi: Sử dụng jre-headless để loại bỏ thư viện đồ họa thừa (X11)
# ==========================================================================

set -e # Dừng ngay nếu có lỗi

echo "--> [1/8] Đang cấu hình hệ thống và RAM ảo..."
sudo apt-get update -y

# 0. CẤU HÌNH SWAP (4GB)
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 1. CÀI ĐẶT JAVA 17 (HEADLESS)
# Tối ưu: Sử dụng jre-headless để tránh kéo theo các thư viện đồ họa X11 rườm rà
echo "--> [2/8] Cài đặt OpenJDK 17 Headless (Server Optimized)..."
sudo apt-get install fontconfig openjdk-17-jre-headless -y

# 2. CÀI ĐẶT JENKINS
echo "--> [3/8] Cài đặt Jenkins..."
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update -y
sudo apt-get install jenkins -y
sudo systemctl enable jenkins
sudo systemctl start jenkins

# 3. CÀI ĐẶT DOCKER
echo "--> [4/8] Cài đặt Docker Engine..."
sudo apt-get install ca-certificates curl gnupg -y
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins
sudo chmod 666 /var/run/docker.sock || true

# 4. CÀI ĐẶT AWS CLI V2
echo "--> [5/8] Cài đặt AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt-get install unzip -y
unzip -o awscliv2.zip
sudo ./aws/install --update
rm -rf aws awscliv2.zip

# 5. CÀI ĐẶT TRIVY
echo "--> [6/8] Cài đặt Trivy..."
sudo apt-get install wget apt-transport-https gnupg lsb-release -y
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy -y

# 6. CÀI ĐẶT PLUGINS JENKINS TỰ ĐỘNG
echo "--> [7/8] Đang cài đặt Jenkins Plugins..."
sudo systemctl stop jenkins
sudo wget https://github.com/jenkinsci/plugin-installation-manager-tool/releases/download/2.13.0/jenkins-plugin-manager-2.13.0.jar -O /opt/jenkins-plugin-manager.jar

PLUGINS="blueocean git github-branch-source workflow-aggregator docker-workflow sonar nodejs aws-credentials amazon-ecr ansicolor credentials-binding pipeline-stage-view htmlpublisher matrix-auth role-strategy timestamper configuration-as-code pipeline-aws"

sudo java -jar /opt/jenkins-plugin-manager.jar --war /usr/share/java/jenkins.war --plugin-download-directory /var/lib/jenkins/plugins --plugins $PLUGINS --skip-failed-plugins

sudo chown -R jenkins:jenkins /var/lib/jenkins/plugins

# 7. CẤU HÌNH TỰ ĐỘNG (Dùng <<'EOF' để tránh lỗi cú pháp với ký tự '(' trong code Groovy)
echo "--> [8/8] Khởi tạo cấu hình bảo mật..."
sudo mkdir -p /var/lib/jenkins/init.groovy.d

sudo tee /var/lib/jenkins/init.groovy.d/pro-setup.groovy <<'EOF'
import jenkins.model.*
import hudson.security.*
import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.domains.*
import com.cloudbees.plugins.credentials.impl.*
import org.jenkinsci.plugins.plaincredentials.impl.*
import hudson.util.Secret
import hudson.plugins.sonar.*
import hudson.plugins.sonar.model.*

def instance = Jenkins.getInstance()

// 1. Skip setup wizard
instance.setInstallState(InstallState.INITIAL_SETUP_COMPLETED)

// 2. Admin user setup (admin / admin123)
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
hudsonRealm.createAccount("admin", "admin123")
instance.setSecurityRealm(hudsonRealm)
instance.setAuthorizationStrategy(new FullControlOnceLoggedInAuthorizationStrategy())

// 3. Tạo placeholder cho Credentials
def domain = Domain.global()
def credentialsStore = instance.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore()

credentialsStore.addCredentials(domain, new StringCredentialsImpl(CredentialsScope.GLOBAL, "github-pat", "GitHub Personal Access Token", Secret.fromString("CHANGEME")))
credentialsStore.addCredentials(domain, new StringCredentialsImpl(CredentialsScope.GLOBAL, "sonar-token", "SonarQube Auth Token", Secret.fromString("CHANGEME")))

// 4. Setup SonarQube Global Configuration
def sonar_inst = instance.getDescriptor("hudson.plugins.sonar.SonarGlobalConfiguration")
def sonar_server = new SonarInstallation(
    "sonarqube-local", 
    "http://localhost:9000", 
    "sonar-token", 
    null, null, new TriggersConfig(), null, null
)
sonar_inst.setInstallations(sonar_server)
sonar_inst.save()

instance.save()
EOF

sudo chown -R jenkins:jenkins /var/lib/jenkins/init.groovy.d
sudo systemctl start jenkins

# CHẠY SONARQUBE DOCKER
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf

sudo docker run -d --name sonarqube -p 9000:9000 --restart always \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  -e SONAR_WEB_JAVAOPTS="-Xmx1536m -Xms512m" \
  sonarqube:lts-community

echo "--------------------------------------------------------"
echo "✅ BOOTSTRAP HOÀN TẤT!"
echo "Truy cập Jenkins: http://<PUBLIC_IP>:8080 (admin/admin123)"
echo "Truy cập SonarQube: http://<PUBLIC_IP>:9000"
echo "--------------------------------------------------------"