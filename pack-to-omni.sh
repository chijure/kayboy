#!/bin/bash

TMPDIR="kava-omni"
OUTFILE="kava-omni.zip"
rm -f $OUTFILE
mkdir -p $TMPDIR
touch ${TMPDIR}/update.webapp
zip -9 -r --exclude=*${TMPDIR}* --exclude=*.git* --exclude=*.DS_Store* --exclude=README.md --exclude=pack-to-omni.sh ${TMPDIR}/application.zip .
ORIGIN="$(grep origin manifest.webapp | cut -d '"' -f 4)"
echo {\"version\": 1, \"manifestURL\": \"${ORIGIN}/manifest.webapp\"} > ${TMPDIR}/metadata.json
cd $TMPDIR
zip -9 -r ../${OUTFILE} .
cd ..
rm -rf $TMPDIR
