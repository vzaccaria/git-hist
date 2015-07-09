Usage:
    git-hist OUTFILE [ -f FILE ] [ -o OPTS ] [ -n ] [ -k KEYS ]
    git-hist ( -h | --help )

Options:
    -n, --nostatus          dont check for a clean repo                       [false]
    -k, --keywords KEYS     select which keywords to show (comma separated)   [all keywords]
    -o, --opts OPTS         invoke git log with OPTS                          []
    -f, --file FILE         read log from file
    -h, --help              help for git-hist

Arguments:
    OUTFILE                 write markdown to this file
