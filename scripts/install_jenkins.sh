#!/bin/bash
# Script bootstrap cho FoodHub Jenkins Server - PRO Version (Automated Setup)
sudo apt update -y

# 1. Cài đặt Java 17 (Yêu cầu cho Jenkins hiện đại)
sudo apt install fontconfig openjdk-17-jre -y

# 2. Cài đặt Jenkins (LTS)
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/" | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update -y
sudo apt-get install jenkins -y
sudo systemctl start jenkins
sudo systemctl enable jenkins

# 3. Cài đặt Docker Engine
sudo apt-get install ca-certificates curl gnupg -y
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# Phân quyền Docker
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins
sudo chmod 666 /var/run/docker.sock

# 4. TỰ ĐỘNG CÀI ĐẶT PLUGIN
sleep 40 # Đợi Jenkins khởi tạo hệ thống file
sudo wget https://github.com/jenkinsci/plugin-installation-manager-tool/releases/download/2.12.13/jenkins-plugin-manager-2.12.13.jar -O /opt/jenkins-plugin-manager.jar

PLUGINS="blueocean git github-branch-source workflow-aggregator docker-workflow \
sonar nodejs aws-credentials amazon-ecr ansicolor credentials-binding \
pipeline-stage-view workspace-cleanup htmlpublisher matrix-auth role-strategy \
dependency-check-jenkins antisamy-markup-formatter cloudbees-folder timestamper configuration-as-code"

sudo java -jar /opt/jenkins-plugin-manager.jar --war /usr/share/java/jenkins.war \
--plugin-download-directory /var/lib/jenkins/plugins --plugins $PLUGINS

# 5. KHỞI TẠO CẤU HÌNH TỰ ĐỘNG (GROOVY SCRIPTS)
sudo mkdir -p /var/lib/jenkins/init.groovy.d

# Script: Setup Admin, GitHub PAT, SonarQube Server & Sonar Token
sudo tee /var/lib/jenkins/init.groovy.d/pro-setup.groovy <<EOF
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

// 1. Skip Setup Wizard
instance.setInstallState(InstallState.INITIAL_SETUP_COMPLETED)

// 2. Tạo User Admin
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
hudsonRealm.createAccount("admin", "admin123")
instance.setSecurityRealm(hudsonRealm)
instance.setAuthorizationStrategy(new FullControlOnceLoggedInAuthorizationStrategy())

// 3. Quản lý Credentials (GitHub & Sonar Token placeholders)
def domain = Domain.global()
def credentialsStore = instance.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore()

// GitHub PAT
def githubToken = new StringCredentialsImpl(CredentialsScope.GLOBAL, "github-pat", "GitHub PAT Placeholder", Secret.fromString("CHANGEME"))
credentialsStore.addCredentials(domain, githubToken)

// SonarQube Token
def sonarToken = new StringCredentialsImpl(CredentialsScope.GLOBAL, "sonar-token", "SonarQube Token Placeholder", Secret.fromString("CHANGEME"))
credentialsStore.addCredentials(domain, sonarToken)

// 4. Cấu hình SonarQube Server trong Global System Configuration
def sonar_inst = instance.getDescriptor("hudson.plugins.sonar.SonarGlobalConfiguration")
def sonar_server = new SonarInstallation(
    "sonarqube-local",         // Name (Dùng trong Jenkinsfile)
    "http://localhost:9000",   // Server URL (Vì chạy Docker cùng máy)
    "sonar-token",             // Server Authentication Token ID
    null,                      // MojoVersion
    null,                      // Additional Properties
    new TriggersConfig(),      // Triggers
    null,                      // Additional Analysis Properties
    null                       // SonarQube Version
)

sonar_inst.setInstallations(sonar_server)
sonar_inst.save()

instance.save()
EOF

# Phân quyền lại và khởi động lại Jenkins
sudo chown -R jenkins:jenkins /var/lib/jenkins/
sudo systemctl restart jenkins

# 6. Cài đặt SonarQube qua Docker
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo docker run -d --name sonarqube -p 9000:9000 --restart always sonarqube:lts-community

# 7. Cài đặt Trivy
sudo apt-get install wget apt-transport-https gnupg lsb-release -y
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy -y

# Cài AWS CLI
sudo apt install awscli -y