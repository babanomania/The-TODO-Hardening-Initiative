package k8ssecurity

deny contains msg if {
  input.kind == "Pod"
  container := input.spec.containers[_]
  container.securityContext.privileged == true
  msg := "privileged container detected"
}
