{{/* ============================================================
  🔧 Hàm: products.name
  Mục đích:
    - Lấy tên chart (hoặc giá trị nameOverride nếu được định nghĩa trong values.yaml).
    - Giới hạn độ dài 63 ký tự để tuân thủ quy tắc DNS của Kubernetes.
============================================================ */}}
{{- define "products.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* ============================================================
  🔧 Hàm: products.fullname
  Mục đích:
    - Tạo tên đầy đủ (fullname) cho tất cả tài nguyên K8s.
    - Nếu người dùng khai báo fullnameOverride → sử dụng trực tiếp.
    - Ngược lại, nối releaseName + chartName, ví dụ: "prod-products".
============================================================ */}}
{{- define "products.fullname" -}}
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
  🔧 Hàm: products.chart
  Mục đích:
    - Tạo chuỗi kết hợp giữa tên chart và phiên bản chart.
    - Thay ký tự '+' bằng '_' để tương thích với nhãn (label) trong Kubernetes.
============================================================ */}}
{{- define "products.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* ============================================================
  🔧 Hàm: products.selectorLabels
  Mục đích:
    - Tạo ra bộ nhãn selector chuẩn để liên kết giữa Deployment và Service.
    - Các nhãn này xác định danh tính "ổn định" của ứng dụng.
============================================================ */}}
{{- define "products.selectorLabels" -}}
app.kubernetes.io/name: {{ include "products.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/* ============================================================
  🔧 Hàm: products.labels
  Mục đích:
    - Tạo bộ nhãn chung cho tất cả tài nguyên (Deployment, Service, HPA...).
    - Bao gồm thông tin về chart, version, người quản lý (Helm), và phân loại hệ thống.
============================================================ */}}
{{- define "products.labels" -}}
helm.sh/chart: {{ include "products.chart" . }}
{{ include "products.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/part-of: food-ordering
app.kubernetes.io/component: products
{{- end -}}

{{/* ============================================================
  🔧 Hàm: products.commonAnnotations
  Mục đích:
    - Hợp nhất annotation chung của chart với annotation riêng từng tài nguyên.
    - Giúp dễ thêm metadata cho các resource mà không cần lặp lại.
  Cách dùng:
    metadata:
      annotations:
        {{- include "products.commonAnnotations" (dict "Chart" .Chart "Values" .Values "Release" .Release "extra" .Values.service.annotations) | nindent 8 }}
============================================================ */}}
{{- define "products.commonAnnotations" -}}
{{- $base := dict -}}
{{- if .Values.annotations -}}
{{- $_ := merge $base .Values.annotations -}}
{{- end -}}
{{- if .extra -}}
{{- $_ := merge $base .extra -}}
{{- end -}}
{{- toYaml $base -}}
{{- end -}}

{{/* ============================================================
  🔧 Hàm: products.serviceAccount.name
  Mục đích:
    - Xác định tên của ServiceAccount sẽ dùng cho ứng dụng.
    - Nếu giá trị serviceAccount.create=true, sẽ sinh tên tự động.
    - Ngược lại, nếu tắt, sẽ dùng tài khoản "default".
============================================================ */}}
{{- define "products.serviceAccount.name" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "products.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}
