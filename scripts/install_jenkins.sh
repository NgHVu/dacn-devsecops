#!/bin/bash
# Script bootstrap cho FoodHub Jenkins Server - PRO Version (Fix lỗi Plugin & AWS CLI)
sudo apt update -y

# 0. CẤU HÌNH RAM ẢO (SWAP)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 1. Cài đặt Java 17
sudo apt install fontconfig openjdk-17-jre -y

# 2. Cài đặt Jenkins
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/" | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update -y
sudo apt-get install jenkins -y
sudo systemctl start jenkins
sudo systemctl enable jenkins

# 3. Cài đặt Docker
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

sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins
sudo chmod 666 /var/run/docker.sock

# 4. TỰ ĐỘNG CÀI ĐẶT PLUGIN (Sửa lỗi ID plugin và bỏ qua lỗi lẻ)
sleep 40
sudo wget https://github.com/jenkinsci/plugin-installation-manager-tool/releases/download/2.12.13/jenkins-plugin-manager-2.12.13.jar -O /opt/jenkins-plugin-manager.jar

# Sửa lại danh sách plugin (dùng IDs chính xác hơn)
PLUGINS="blueocean git github-branch-source workflow-aggregator docker-workflow \
sonar nodejs aws-credentials amazon-ecr ansicolor credentials-binding \
pipeline-stage-view htmlpublisher matrix-auth role-strategy \
antisamy-markup-formatter cloudbees-folder timestamper configuration-as-code"

# Thêm flag --skip-failed-plugins để không làm dừng cả script nếu 1 plugin bị lỗi link
sudo java -jar /opt/jenkins-plugin-manager.jar --war /usr/share/java/jenkins.war \
--plugin-download-directory /var/lib/jenkins/plugins --plugins $PLUGINS --skip-failed-plugins

# 5. KHỞI TẠO CẤU HÌNH TỰ ĐỘNG
sudo mkdir -p /var/lib/jenkins/init.groovy.d
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
instance.setInstallState(InstallState.INITIAL_SETUP_COMPLETED)
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
hudsonRealm.createAccount("admin", "admin123")
instance.setSecurityRealm(hudsonRealm)
instance.setAuthorizationStrategy(new FullControlOnceLoggedInAuthorizationStrategy())

def domain = Domain.global()
def credentialsStore = instance.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore()
credentialsStore.addCredentials(domain, new StringCredentialsImpl(CredentialsScope.GLOBAL, "github-pat", "GitHub PAT", Secret.fromString("CHANGEME")))
credentialsStore.addCredentials(domain, new StringCredentialsImpl(CredentialsScope.GLOBAL, "sonar-token", "SonarQube Token", Secret.fromString("CHANGEME")))

def sonar_inst = instance.getDescriptor("hudson.plugins.sonar.SonarGlobalConfiguration")
def sonar_server = new SonarInstallation("sonarqube-local", "http://localhost:9000", "sonar-token", null, null, new TriggersConfig(), null, null)
sonar_inst.setInstallations(sonar_server)
sonar_inst.save()
instance.save()
EOF

sudo chown -R jenkins:jenkins /var/lib/jenkins/
sudo systemctl restart jenkins

# 6. Cài đặt SonarQube
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo docker run -d --name sonarqube -p 9000:9000 --restart always \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  -m 1g --memory-swap 2g \
  sonarqube:lts-community

# 7. Cài đặt Trivy
sudo apt-get install wget apt-transport-https gnupg lsb-release -y
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy -y

# 8. Cài AWS CLI (Fix lỗi trên Ubuntu 24.04)
sudo apt-get install software-properties-common -y
sudo add-apt-repository universe -y
sudo apt-get update
sudo apt-get install awscli -y || sudo apt-get install aws-cli -y

echo "FoodHub Setup Completed Successfully!"