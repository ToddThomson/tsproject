export class NameGenerator {
    // Base64 char set: 26 lowercase letters + 26 uppercase letters + '$' + '_' + 10 digits                                          
    private base64Chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_0123456789";
    private index: number = 0;

    public getName(): string {
        // 2 and 3 letter reserved words that cannot be used in identifier names
        const RESERVED_KEYWORDS: string[] = ["do", "if", "in", "for", "int", "let", "new", "try", "var"];

        let name: any;

        while ( true ) {
            name = this.generateName();

            if ( RESERVED_KEYWORDS.indexOf( name ) > 0 ) {
                continue;
            }
            else {
                return name;
            }
        }
    }

    public reset() {
        this.index = 0;
    }

    private generateName(): string {
        let id = this.index;
        // The first 54 chars of the base64 char set are used for the first char of the identifier
        let name: string = this.base64Chars[id % 54];
        id = Math.floor( id / 54 );

        while ( id > 0 ) {
            // The full base64 char set is used after the first char of the identifier
            name += this.base64Chars[id % 64];
             id = Math.floor( id / 64 );
        }

        this.index++;

        return name;
    }
}
