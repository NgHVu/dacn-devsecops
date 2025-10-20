{{/* ============================================================
  🔧 Hàm: orders.name
  Mục đích:
    - Lấy tên chart (hoặc giá trị nameOverride nếu được định nghĩa trong values.yaml).
    - Giới hạn độ dài 63 ký tự để tuân thủ quy tắc DNS của Kubernetes.
============================================================ */}}
{{- define "orders.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* ============================================================
  🔧 Hàm: orders.fullname
  Mục đích:
    - Tạo tên đầy đủ (fullname) cho tất cả tài nguyên K8s.
    - Nếu người dùng khai báo fullnameOverride → sử dụng trực tiếp.
    - Ngược lại, nối releaseName + chartName, ví dụ: "prod-orders".
============================================================ */}}
{{- define "orders.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/* ============================================================
  🔧 Hàm: orders.chart
  Mục đích:
    - Tạo chuỗi kết hợp giữa tên chart và phiên bản chart.
    - Thay ký tự '+' bằng '_' để tương thích với nhãn (label) trong Kubernetes.
============================================================ */}}
{{- define "orders.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* ============================================================
  🔧 Hàm: orders.selectorLabels
  Mục đích:
    - Tạo ra bộ nhãn selector chuẩn để liên kết giữa Deployment và Service.
    - Các nhãn này xác định danh tính "ổn định" của ứng dụng.
============================================================ */}}
{{- define "orders.selectorLabels" -}}
app.kubernetes.io/name: {{ include "orders.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/* ============================================================
  🔧 Hàm: orders.labels
  Mục đích:
    - Tạo bộ nhãn chung cho tất cả tài nguyên (Deployment, Service, HPA...).
    - Bao gồm thông tin về chart, version, người quản lý (Helm), và phân loại hệ thống.
============================================================ */}}
{{- define "orders.labels" -}}
helm.sh/chart: {{ include "orders.chart" . }}
{{ include "orders.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/part-of: food-ordering
app.kubernetes.io/component: orders
{{- end -}}

{{/* ============================================================
  🔧 Hàm: orders.serviceAccount.name
  Mục đích:
    - Xác định tên của ServiceAccount sẽ dùng cho ứng dụng.
    - Nếu giá trị serviceAccount.create=true, sẽ sinh tên tự động.
    - Ngược lại, nếu tắt, sẽ dùng tài khoản "default".
============================================================ */}}
{{- define "orders.serviceAccount.name" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "orders.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}
