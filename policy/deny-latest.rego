package k8ssecurity

deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  endswith(container.image, ":latest")
  msg = sprintf("%s uses latest tag", [input.metadata.name])
}
