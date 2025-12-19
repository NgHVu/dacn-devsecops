#!/bin/bash
sudo apt update -y

# 1. Cài đặt Java (Jenkins cần Java)
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

# Phân quyền Docker cho user ubuntu và jenkins (để không cần sudo)
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins
sudo chmod 666 /var/run/docker.sock

# 4. Chạy SonarQube bằng Docker
# Tăng giới hạn bộ nhớ ảo (Yêu cầu bắt buộc của SonarQube/Elasticsearch)
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf

# Chạy container SonarQube
sudo docker run -d --name sonarqube -p 9000:9000 --restart always sonarqube:lts-community

# Cài AWS CLI
sudo apt install awscli -y