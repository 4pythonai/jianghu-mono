docker  kill p73test
docker  rm   p73test
docker run -it  --name p73test -v /Users/alex/codebase/nanx/dockers/src:/var/www/html  tangyongjin/php73  /bin/bash
