#!/usr/bin/env bash
export CLOUDFOUNDRY_USERNAME=kristsauders@gmail.com
if [ -z "$CLOUDFOUNDRY_PASSWORD" ]; then
    echo "CLOUDFOUNDRY_PASSWORD must be set to $CLOUDFOUNDRY_USERNAME's cloudfoundry password "
    echo "==== Your current environment====="
    env
    exit 1
fi
gem install vmc
vmc target https://api.cloudfoundry.com
vmc login $CLOUDFOUNDRY_USERNAME --password $CLOUDFOUNDRY_PASSWORD
vmc push cf-docs-contrib
