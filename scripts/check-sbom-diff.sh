#!/bin/sh
set -e

# Compare generated SBOMs with committed versions
if ! git diff --quiet sboms; then
  echo "SBOMs have changed. Possible dependency alteration detected." >&2
  exit 1
fi
