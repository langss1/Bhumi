$env:PATH = 'C:\besu\bin;' + $env:PATH
$json = '["0x33d6e1f7b12d20291ad537ccd1443fbb009c9324","0x1997563695e73f38fbbb881d24c227b519b04c58","0xf995523c889ccb4ae7785babae4e86e6be2c7f3d"]'
$json | Set-Content test.json
besu rlp encode --type=IBFT_EXTRA_DATA --from=test.json
