#!/bin/bash
 
ccred=$(echo -e "\033[0;31m")
ccyellow=$(echo -e "\033[0;33m")
ccgreen=$(echo -e "\033[0;32m")
ccend=$(echo -e "\033[0m")
 
exit_code=0
 
cd "$(git rev-parse --show-toplevel)"
rm -rf ./build 
mkdir build
find public -type d -printf "build/%P\0" | xargs -0 mkdir -p

#Minify
echo -e "$ccyellow========Minify========$ccend"
for ext in 'js'
do
    for infile in `find ./public -name "*.$ext" |grep -v min|grep -v lib`
    do
        outfile="./build/$(echo $infile | cut -c10- | sed 's/\(.*\)\..*/\1/').min.$ext"
        echo -n -e "\nMinifying $infile to $outfile: "
        if [ ! -f "$outfile" ] || [ "$infile" -nt "$outfile" ]
        then
            yui-compressor "$infile" > "$outfile"
            if [ `echo $?` != 0 ]
            then
                exit_code=1
                echo -e "\n$ccred========Failed minification of $infile to $outfile . Reverting========$ccend\n" >&2
#            else
                #echo $ccgreen Success.$ccend
            fi
        #else
            #echo $ccgreen Not modified.$ccend
        fi
    done
    cp -a ./public/js/lib/. ./build/js/lib/
done


echo -e "\n$ccyellow========Finished========$ccend"
exit $exit_code
