package k8ssecurity

deny contains msg if {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  env := container.env[_]
  env.name == "POSTGRES_PASSWORD"
  env.value != ""
  msg := sprintf("%s contains plaintext password", [input.metadata.name])
}
