package k8ssecurity

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  container.securityContext.privileged == true
  msg = sprintf("%s uses privileged container", [input.metadata.name])
}
