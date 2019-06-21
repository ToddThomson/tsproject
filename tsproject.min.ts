import * as a  from "typescript";
import chalk from "chalk";
import * as b  from "fs";
import * as c        from "chokidar";
import * as d    from "path";
import * as h      from "stream";
import VinylFile = require( "vinyl" )
import * as _ from "lodash";
import * as k        from "glob";
import * as l        from "prettier";
                                     var m     = {
    none: 0,
    error: 1,
    warn: 2,
    trace: 3,
    info: 4
};           class n      {
    private static f       : number = m    .none;
    private static g      : string = "logger";

    public static j       ( a    : number ) {
        this.f        = a    ;
    }

    public static k      ( a   : string ) {
        this.g       = a   ;
    }

    public static l  ( ...c   : any[] ) {
        console.log( chalk.gray( `[${this.g      }]` ), ...c    );
    }

    public static p   ( ...c   : any[] ) {
        if ( this.f        < m    .info ) {
            return;
        }

        console.log( chalk.gray( `[${this.g      }]` + chalk.blue( " INFO: " ) ), ...c    );
    }

    public static r   ( ...c   : any[] ) {
        if ( this.f        < m    .warn ) {
            return;
        }

        console.log( `[${this.g      }]` + chalk.yellow( " WARNING: " ), ...c    );
    }

    public static t    ( ...b   : any[] ) {
        if ( this.f        < m    .error ) {
            return;
        }

        console.log( `[${this.g      }]` + chalk.red( " ERROR: " ), ...b    );
    }

    public static v    ( ...b   : any[] ) {
        if ( this.f        < m    .error ) {
            return;
        }

        console.log( `[${this.g      }]` + chalk.gray( " TRACE: " ), ...b    );
    }
}  
                                                                                                              namespace TsCore {

    export interface WatchedSourceFile extends a .SourceFile {
        fileWatcher?: c       .FSWatcher;
    }

    export function f              ( b   : string, c        : string ): boolean {
        let d       = b   .length;
        let e      = c        .length;
        return d       > e      && b   .substr( d       - e     , e      ) === c        ;
    }

    export const g                   = [".ts", ".tsx", ".d.ts"];

    export const h                    = g                  ;

    export function i                        ( a       : string ) {
        if ( !a        ) { return false; }

        for ( let b         of g                   ) {
            if ( f              ( a       , b         ) ) {
                return true;
            }
        }

        return false;
    }

    export function j                      ( c     : a .Symbol ): a .SourceFile {
        const f            = c     .getDeclarations();
        
        if ( f            && f           .length > 0 ) {
            if ( f           [0].kind === a .SyntaxKind.SourceFile ) {
                return f           [0].getSourceFile();
            }
        }

        return undefined;
    }

    export function k                    ( b   : a .Node ): a .Expression {
        if ( b   .kind === a .SyntaxKind.ImportDeclaration ) {
            return ( <a .ImportDeclaration>b    ).moduleSpecifier;
        }
        if ( b   .kind === a .SyntaxKind.ImportEqualsDeclaration ) {
            let c         = ( <a .ImportEqualsDeclaration>b    ).moduleReference;
            if ( c        .kind === a .SyntaxKind.ExternalModuleReference ) {
                return ( <a .ExternalModuleReference>c         ).expression;
            }
        }
        if ( b   .kind === a .SyntaxKind.ExportDeclaration ) {
            return ( <a .ExportDeclaration>b    ).moduleSpecifier;
        }

        return undefined;
    }

    export function m               ( f      : a .DiagnosticMessage, ...g   : any[] ): a .Diagnostic {
        // FUTURE: Typescript 1.8.x supports localized diagnostic messages.
        let h             = f      .message;

        if ( arguments.length > 1 ) {
            h             = q                   ( h            , arguments, 1 );
        }

        return {
            file: undefined,
            start: undefined,
            length: undefined,
            messageText: h            ,
            category: f      .category,
            code: f      .code
        };
    }

    function q                   ( a   : string, b   : any, c        : number ) {
        c         = c         || 0;
        return a   .replace( /{(\d+)}/g, function ( d    : any, a    : any ) {
            return b   [+a     + c        ];
        });
    }

    // An alias symbol is created by one of the following declarations:
    // import <symbol> = ...
    // import <symbol> from ...
    // import * as <symbol> from ...
    // import { x as <symbol> } from ...
    // export { x as <symbol> } from ...
    // export = ...
    // export default ...
    export function t                       ( b   : a .Node ): boolean {
        return b   .kind === a .SyntaxKind.ImportEqualsDeclaration ||
            b   .kind === a .SyntaxKind.ImportClause && !!( <a .ImportClause>b    ).name ||
            b   .kind === a .SyntaxKind.NamespaceImport ||
            b   .kind === a .SyntaxKind.ImportSpecifier ||
            b   .kind === a .SyntaxKind.ExportSpecifier ||
            b   .kind === a .SyntaxKind.ExportAssignment && ( <a .ExportAssignment>b    ).expression.kind === a .SyntaxKind.Identifier;
    }

    export function w               ( b   : string ): string {
        return b   .replace( /\\/g, "/" );
    }

    export function x              ( a   : string ): string {
        return a   .replace( /\.ts/, ".js" );
    }
}
                                               namespace Utils {
    export function c      <T, U>( b    : ReadonlyArray<T> | undefined, e       : ( a      : T, b    : number ) => U | undefined ): U | undefined {
        if ( b     ) {
            for ( let i = 0, f   = b    .length; i < f  ; i++ ) {
                let g      = e       ( b    [i], i );
                if ( g      ) {
                    return g     ;
                }
            }
        }

        return undefined;
    }

    export function g       <T>( b    : T[], c    : T ): boolean {
        if ( b     ) {
            for ( let v of b     ) {
                if ( v === c     ) {
                    return true;
                }
            }
        }

        return false;
    }

    let h              = Object.prototype.hasOwnProperty;

    export function k          <T>( b  : a .MapLike<T>, e  : string ): boolean {
        return h             .call( b  , e   );
    }

    export function q    <T>( a     : T ): T {
        let b     : any = {};
        for ( let c  in a      ) {
            b     [c ] = ( <any>a      )[c ];
        }
        return <T>b     ;
    }

    export function r  <T, U>( b    : T[], f: ( x: T ) => U ): U[] {
        let c     : U[];
        if ( b     ) {
            c      = [];
            for ( let v of b     ) {
                c     .push( f( v ) );
            }
        }

        return c     ;
    }

    export function y     <T1, T2>( c    : a .MapLike<T1>, f     : a .MapLike<T2> ): a .MapLike<T1 & T2> {

        let g        = 1;
        let h     : a .MapLike<T1 & T2> = {};
        
        for ( let i  in c     ) {
            ( h      as any )[i ] = c    [i ];
        }
        for ( let j  in f      ) {
            if ( !k          ( h     , j  ) ) {
                ( h      as any )[j ] = f     [j ];
            }
        }
        return h     ;
    }

    export function E        ( b  : string, c    : number, d        : string ) {
        return b  .substr( 0, c     ) + d         + b  .substr( c     + d        .length );
    }
}
                                            class o              {

    private b     : a .ExitStatus;
    private readonly e     : ReadonlyArray<a .Diagnostic>

    constructor( c     : a .ExitStatus, d     ?: ReadonlyArray<a .Diagnostic> ) {
        this.b      = c     ;
        this.e      = d     ;
    }

    public f        (): ReadonlyArray<a .Diagnostic> {
        return this.e     ;
    }

    public g        (): a .ExitStatus {
        return this.b     ;
    }

    public h        (): boolean {
        return ( this.b      === a .ExitStatus.Success );
    }
}
                                                                                                                                                                                                                                                                                                                                                                                                       class p                   implements a .CompilerHost {

    private b     : a .MapLike<string> = {};
    private e             : a .MapLike<boolean> = {};
    private f                 : number = 0;
    private g              : a .MapLike<boolean> = {};
    private h                  : number = 0;
    private i            : a .MapLike<string> = {};

    protected j              : a .CompilerOptions;
    private m       : a .CompilerHost;

    constructor( b              : a .CompilerOptions ) {
        this.j               = b              ;
        this.m        = a .createCompilerHost( this.j               );
    }

    public s        () {
        return this.b     ;
    }

    public t                ( o       : string, p              : a .ScriptTarget, q      ?: ( a      : string ) => void ): a .SourceFile {

        // Use baseHost to get the source file
        //Logger.trace( "getSourceFile() reading source file from fs: ", fileName );
        return this.m       .getSourceFile( o       , p              , q       );
    }

    public getSourceFile = this.t                ;

    public writeFile( e       : string, f   : string, g                 : boolean, h      ?: ( a      : string ) => void ) {
        this.b     [e       ] = f   ;
    }

    public fileExists = ( i       : string ): boolean => {
        i        = this.getCanonicalFileName( i        );

        // Prune off searches on directories that don't exist
        if ( !this.directoryExists( d   .dirname( i        ) ) ) {
            return false;
        }

        if ( Utils.k          ( this.g              , i        ) ) {
            //Logger.trace( "fileExists() Cache hit: ", fileName, this.fileExistsCache[ fileName ] );
            return this.g              [i       ];
        }
        this.h                  ++;

        //Logger.trace( "fileExists() Adding to cache: ", fileName, this.baseHost.fileExists( fileName ), this.fileExistsCacheSize );
        return this.g              [i       ] = this.m       .fileExists( i        );
    }

    public readFile( a       : string ): string {
        if ( Utils.k          ( this.i            , a        ) ) {
            //Logger.trace( "readFile() cache hit: ", fileName );
            return this.i            [a       ];
        }

        n     .v    ( "readFile() Adding to cache: ", a        );
        return this.i            [a       ] = this.m       .readFile( a        );
    }

    // Use Typescript CompilerHost "base class" implementation..

    public getDefaultLibFileName( b      : a .CompilerOptions ) {
        return this.m       .getDefaultLibFileName( b       );
    }

    public getCurrentDirectory() {
        return this.m       .getCurrentDirectory();
    }

    public getDirectories( a   : string ): string[] {
        return this.m       .getDirectories( a    );
    } 

    public getCanonicalFileName( b       : string ) {
        return this.m       .getCanonicalFileName( b        );
    }

    public useCaseSensitiveFileNames() {
        return this.m       .useCaseSensitiveFileNames();
    }

    public getNewLine() {
        return this.m       .getNewLine();
    }

    public directoryExists( g            : string ): boolean {
        if ( Utils.k          ( this.e             , g             ) ) {
            //Logger.trace( "dirExists() hit", directoryPath, this.dirExistsCache[ directoryPath ] );
            return this.e             [g            ];
        }
        
        this.f                 ++;

        //Logger.trace( "dirExists Adding: ", directoryPath, ts.sys.directoryExists( directoryPath ), this.dirExistsCacheSize );
        return this.e             [g            ] = a .sys.directoryExists( g             );
    }
}
                                            class q             extends h     .t        {

    constructor (a   ?: h     .ReadableOptions ) {
        super( { objectMode: true } );
    }

    _read() {
        // Safely do nothing
    }
}
                                                                                                                                                                                                                                                  interface TsCompilerOptions extends a .CompilerOptions {
    diagnostics?: boolean;
    listFiles?: boolean;
    watch?: boolean;
}
                                                                                                              class r                  {

    public a          ( b   : string ) {
        n     .l  ( b    );
    }

    public b          ( c   : string, d    : string ) {
        n     .l  ( this.g       ( c    + ":", 25 ) + chalk.magenta( this.f      ( d    .toString(), 10 ) ) );
    }

    public c          ( a   : string, e    : number ) {
        this.b          ( a   , "" + e     );
    }

    public d         ( e   : string, f   : number ) {
        this.b          ( e   , ( f    / 1000 ).toFixed( 2 ) + "s" );
    }

    public e               ( a   : string, c         : number ) {
        this.b          ( a   , c         .toFixed( 2 ) + "%" );
    }

    private f      ( s: string, a     : number ) {
        while ( s.length < a      ) {
            s = " " + s;
        }
        return s;
    }

    private g       ( s: string, a     : number ) {
        while ( s.length < a      ) {
            s = s + " ";
        }

        return s;
    }
}
 
       const enum BundlePackageType {
    None = 0,
    Library = 1,
    Component = 2
}           class t             {
    private b          : BundlePackageType;
    private c               : string = undefined;
    
    constructor( a          : BundlePackageType, d               : string ) {
        this.b           = a          ;
        this.c                = d               ;
    }

    public d             (): BundlePackageType {
        return this.b          ;
    }

    public e                  (): string {
        return this.c               ;
    }
}
                                                                                                                                                                                                                                                                                             interface BundleConfig {
    sourceMap?: boolean;
    declaration?: boolean;
    outDir?: string;
    minify?: boolean;
    package?: t            ;
}           interface Bundle {
    name: string;
    fileNames: string[];
    config: BundleConfig;
}           interface ParsedBundlesResult {
    bundles: Bundle[];
    errors: a .Diagnostic[];
}           class u            {
    
    public c              ( f   : any, g       : string ): ParsedBundlesResult {
        var h     : a .Diagnostic[] = [];

        return {
            bundles: b         (),
            errors: h     
        };

        function b         (): Bundle[] {
            var c      : Bundle[] = [];
            var e           = f   ["bundles"];

            if ( e           ) {
                n     .p   ( e           );

                for ( var i  in e           ) {
                    n     .p   ( "Bundle Id: ", i , e          [i ] );
                    var q         : any = e          [i ];
                    var v         : string;
                    var x        : string[] = [];
                    var z     : any = {};

                    // Name
                    v          = d   .join( g       , i  );

                    // Files..
                    if ( Utils.k          ( q         , "files" ) ) {
                        if ( q         ["files"] instanceof Array ) {
                            x         = Utils.r  ( <string[]>q         ["files"], s => d   .join( g       , s ) );
                            n     .p   ( "bundle files: ", x         );
                        }
                        else {
                            h     .push( TsCore.m               ( { code: 6063, category: a .DiagnosticCategory.Error, key: "Bundle_0_files_is_not_an_array_6063", message: "Bundle '{0}' files is not an array." }, i  ) );
                        }
                    }
                    else {
                        h     .push( TsCore.m               ( { code: 6062, category: a .DiagnosticCategory.Error, key: "Bundle_0_requires_an_array_of_files_6062", message: "Bundle '{0}' requires an array of files." }, i  ) );
                    }

                    // Config..
                    if ( Utils.k          ( q         , "config" ) ) {
                        z      = q         .config;
                    }

                    z     .package = C                 ( z      );

                    c      .push( { name: v         , fileNames: x        , config: z      } );
                }
            }

            return c      ;
        }

        function C                 ( b     : any ): t             {

            // TODO: Add diagnostics for input errors..

            let c                : BundlePackageType = BundlePackageType.None;
            let d                     : string = undefined;

            let e             : a .MapLike<BundlePackageType> = {
                "none": BundlePackageType.None,
                "library": BundlePackageType.Library,
                "component": BundlePackageType.Component
            };

            if ( Utils.k          ( b     , "package" ) ) {
                let f          : string = b     [ "package" ];

                if ( typeof( f           ) === "string" ) {
                    if ( Utils.k          ( e             , f          .toLowerCase() ) ) {
                        c                 = e             [ f          .toLowerCase() ]
                    }
                }
            }

            if ( Utils.k          ( b     , "packageNamespace" ) ) {
                let g                = b     [ "packageNamespace" ];
                    
                if ( typeof( g                ) === "string" ) {
                    d                      = g               ;
                }
            }

            return new t            ( c                , d                      );
        }
    }
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  class w        {

    private b           : p                  ;
    private u      : a .Program;
    private x            : q            ;
    private z              : TsCompilerOptions;

    private C          : number = 0;
    private D       : number = 0;
    private E          : number = 0;

    constructor( c           : p                  , f      : a .Program, g            : q             ) {
        this.b            = c           
        this.u       = f      ;
        this.x             = g            ;
        this.z               = this.u      .getCompilerOptions();
    }

    public I      ( q      ?: ( a      : string ) => void ): o              {
        this.E           = this.C           = new Date().getTime();

        n     .l  ( "Compiling project files..." );

        // Check for preEmit diagnostics
        var r           = a .getPreEmitDiagnostics( this.u       );

        // Return if noEmitOnError flag is set, and we have errors
        if ( this.z              .noEmitOnError && r          .length > 0 ) {
            return new o             ( a .ExitStatus.DiagnosticsPresent_OutputsSkipped, r           );
        }

        this.C           = new Date().getTime() - this.C          ;

        if ( !this.z              .noEmit ) {
            // Compile the source files..
            let t         = new Date().getTime();

            const v          = this.u      .emit();

            this.D        = new Date().getTime() - t        ;

            r           = r          .concat( v         .diagnostics as a .Diagnostic[] );

            // If the emitter didn't emit anything, then we're done
            if ( v         .emitSkipped ) {
                return new o             ( a .ExitStatus.DiagnosticsPresent_OutputsSkipped, r           );
            }

            // Stream the compilation output...
            var y          = this.b           .s        ();

            for ( var A        in y          ) {
                var F        = y         [A       ];

                var H           = new VinylFile( {
                    path: A       ,
                    contents: Buffer.from( F        )
                });

                this.x            .B   ( H           );
            }
        }

        this.E           = new Date().getTime() - this.E          ;

        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if ( r          .length > 0 ) {
            return new o             ( a .ExitStatus.DiagnosticsPresent_OutputsGenerated, r           );
        }

        // TODO: diagnostics is now internal

        if ( this.z              .diagnostics ) {
            this.L               ();
        }

        return new o             ( a .ExitStatus.Success );
    }

    private L               () {
        let b                  = new r                 ();

        b                 .c          ( "Files", this.u      .getSourceFiles().length );
        b                 .c          ( "Lines", this.M            () );
        b                 .d         ( "Pre-emit time", this.C           );
        b                 .d         ( "Emit time", this.D        );
        b                 .d         ( "Compile time", this.E           );
    }

    private M            (): number {
        var a     = 0;
        Utils.c      ( this.u      .getSourceFiles(), b    => {
            if ( !b   .isDeclarationFile ) {
                a     += this.N            ( b    ).length;
            }
        });

        return a    ;
    }

    private N            ( b         : a .SourceFile ): ReadonlyArray<number> {
        return b         .getLineStarts();
    }
} 
                                                                                                                                                                     interface ProjectConfig {
    success: boolean;
    compilerOptions?: TsCompilerOptions;
    fileNames?: string[];
    bundles?: Bundle[];
    errors?: a .Diagnostic[];
}

                                                                                                                                                                                                                                                                                                                                                                                                                                                  class y                 extends p                   {

    private u               : a .Program;
    private x                  : { (b         : a .SourceFile, c   : string, d    : any): void; (a   : TsCore.WatchedSourceFile, b   : string, c   : any): void; };

    constructor( b              : a .CompilerOptions, c                  ?: ( b         : a .SourceFile, c   : string, d    : any ) => void ) {
        super( b               );

        this.x                   = c                  ;
    }

    public z                  ( b      : a .Program ) {
        this.u                = b      ;
    }

    public getSourceFile = ( b       : string, d              : a .ScriptTarget, e      ?: ( a      : string ) => void ): a .SourceFile => {

        if ( this.u                ) {
            // Use program to get source files
            let g         : TsCore.WatchedSourceFile = this.u               .getSourceFile( b        );

            // If the source file has not been modified (it has a fs watcher ) then use it            
            if ( g          && g         .fileWatcher ) {
                n     .v    ( "getSourceFile() watcher hit for: ", b        );
                return g         ;
            }
        }
        
        // Use base class to get the source file
        n     .v    ( "getSourceFile() reading source file from fs: ", b        );
        let f         : TsCore.WatchedSourceFile = super.t                ( b       , d              , e       );

        if ( f          && this.j              .watch ) {
            f         .fileWatcher = c       .watch( f         .fileName );
            f         .fileWatcher.on( "change", ( a   : string, b    :any ) => this.x                  ( f         , a   , b     ) );
        }

        return f         ;
    }
}
                                                                                                                          namespace Ast {

    export interface ContainerNode extends a .Node {
        nextContainer?: ContainerNode;
    }

    export function b                      ( f   : a .Node ): a .ModifierFlags {
        let g     = a .ModifierFlags.None;

        if ( f   .modifiers ) {
            for ( const h        of f   .modifiers ) {
                g     |= c             ( h       .kind );
            }
        }

        if ( f   .flags & a .NodeFlags.NestedNamespace || ( f   .kind === a .SyntaxKind.Identifier && ( <a .Identifier>f    ).isInJSDocNamespace ) ) {
            g     |= a .ModifierFlags.Export;
        }

        return g    ;
    }

    export function c             ( b    : a .SyntaxKind ): a .ModifierFlags {
        switch ( b     ) {
            case a .SyntaxKind.StaticKeyword: return a .ModifierFlags.Static;
            case a .SyntaxKind.PublicKeyword: return a .ModifierFlags.Public;
            case a .SyntaxKind.ProtectedKeyword: return a .ModifierFlags.Protected;
            case a .SyntaxKind.PrivateKeyword: return a .ModifierFlags.Private;
            case a .SyntaxKind.AbstractKeyword: return a .ModifierFlags.Abstract;
            case a .SyntaxKind.ExportKeyword: return a .ModifierFlags.Export;
            case a .SyntaxKind.DeclareKeyword: return a .ModifierFlags.Ambient;
            case a .SyntaxKind.ConstKeyword: return a .ModifierFlags.Const;
            case a .SyntaxKind.DefaultKeyword: return a .ModifierFlags.Default;
            case a .SyntaxKind.AsyncKeyword: return a .ModifierFlags.Async;
            case a .SyntaxKind.ReadonlyKeyword: return a .ModifierFlags.Readonly;
        }

        return a .ModifierFlags.None;
    }

    export const enum ContainerFlags {
        // The current node is not a container, and no container manipulation should happen before
        // recursing into it.
        None = 0,

        // The current node is a container.  It should be set as the current container (and block-
        // container) before recursing into it.  The current node does not have locals.  Examples:
        //
        //      Classes, ObjectLiterals, TypeLiterals, Interfaces...
        IsContainer = 1 << 0,

        // The current node is a block-scoped-container.  It should be set as the current block-
        // container before recursing into it.  Examples:
        //
        //      Blocks (when not parented by functions), Catch clauses, For/For-in/For-of statements...
        IsBlockScopedContainer = 1 << 1,

        // The current node is the container of a control flow path. The current control flow should
        // be saved and restored, and a new control flow initialized within the container.
        IsControlFlowContainer = 1 << 2,

        IsFunctionLike = 1 << 3,
        IsFunctionExpression = 1 << 4,
        HasLocals = 1 << 5,
        IsInterface = 1 << 6,
        IsObjectLiteralOrClassExpressionMethod = 1 << 7,

        // If the current node is a container that also contains locals.  Examples:
        //
        //      Functions, Methods, Modules, Source-files.
        IsContainerWithLocals = IsContainer | HasLocals
    }
    
    export function f                          ( b         : a .Node ): boolean {

        if ( b         .kind !== a .SyntaxKind.BinaryExpression ) {
            return false;
        }

        const c    = <a .BinaryExpression>b         ;
    
        if ( c   .operatorToken.kind !== a .SyntaxKind.EqualsToken || c   .left.kind !== a .SyntaxKind.PropertyAccessExpression ) {
            return false;
        }
        
        const d   = <a .PropertyAccessExpression>c   .left;
        
        if ( d  .expression.kind === a .SyntaxKind.PropertyAccessExpression ) {
            // chained dot, e.g. x.y.z = expr; this var is the 'x.y' part
            const e                   = <a .PropertyAccessExpression>d  .expression;
            
            if ( e                  .expression.kind === a .SyntaxKind.Identifier && e                  .name.text === "prototype" ) {
                return true;
            }    
        }

        return false;
    }

    export function g             ( b   : a .Node ): b    is a .FunctionLike {
        return b    && l                 ( b   .kind );
    }

    export function h                            ( b   : a .SyntaxKind ): boolean {
        switch ( b    ) {
            case a .SyntaxKind.FunctionDeclaration:
            case a .SyntaxKind.MethodDeclaration:
            case a .SyntaxKind.Constructor:
            case a .SyntaxKind.GetAccessor:
            case a .SyntaxKind.SetAccessor:
            case a .SyntaxKind.FunctionExpression:
            case a .SyntaxKind.ArrowFunction:
                return true;
            default:
                return false;
        }
    }

    export function l                 ( b   : a .SyntaxKind ): boolean {
        switch ( b    ) {
            case a .SyntaxKind.MethodSignature:
            case a .SyntaxKind.CallSignature:
            case a .SyntaxKind.ConstructSignature:
            case a .SyntaxKind.IndexSignature:
            case a .SyntaxKind.FunctionType:
            case a .SyntaxKind.JSDocFunctionType:
            case a .SyntaxKind.ConstructorType:
                return true;
            default:
                return h                            ( b    );
        }
    }

    export function m                                     ( c   : a .Node): c    is a .MethodDeclaration {
        return c   .kind === a .SyntaxKind.MethodDeclaration &&
            ( c   .parent.kind === a .SyntaxKind.ObjectLiteralExpression ||
              c   .parent.kind === a .SyntaxKind.ClassExpression );
    }

    export function o                  ( c     : a .Symbol ): boolean {
        if ( c      && ( c     .flags & a .SymbolFlags.Interface ) ) {
            if ( c     .valueDeclaration ) {
                let d     = b                      ( c     .valueDeclaration );

                //if ( !( flags & ts.ModifierFlags.Export ) ) {
                //    return true;
                //}

                // FUTURE: How to make interfaces internal by convention?
                return false;
            }
        }

        return false;
    }

    export function q              ( c     : a .Symbol ): boolean {
        if ( c      && ( c     .flags & a .SymbolFlags.Class ) ) {

            // If the class is from an extern API or ambient then it cannot be considered internal.
            if ( Ast.H              ( c      ) || Ast.I               ( c      ) ) {
                return false;
            }

            // A class always has a value declaration
            let d     = b                      ( c     .valueDeclaration );

            // By convention, "Internal" classes are ones that are not exported.
            if ( !( d     & a .ModifierFlags.Export ) ) {
                return true;
            }
        }

        return false;
    }

    export function s              ( c          : a .Symbol ): boolean {
        if ( c           && c          .valueDeclaration ) {
            if ( b                      ( c          .valueDeclaration ) & a .ModifierFlags.Abstract ) {
                return true;
            }
        }

        return false;
    }

    export function t                         ( f         : a .Node, g      : a .TypeChecker ): a .Symbol[] {
        let h                    : a .Symbol[] = [];
        
        function f                          ( c             : a .HeritageClause, d      : a .TypeChecker ): void {
            const e                  = c             .types;

            if ( e                  ) {
                for ( const g           of e                  ) {
                    // The "properties" of inheritedType includes all the base class/interface properties
                    const i            : a .Type = d      .getTypeAtLocation( g           );

                    let j                        = i            .symbol.valueDeclaration;
                    
                    if ( j                        ) {
                        let m                            = (<a .ClassLikeDeclaration>j                       ).heritageClauses;
        
                        if ( m                            ) {
                            for ( const n                           of m                            ) {
                                f                          ( n                          , d       );
                            }
                        }
                    }

                    const k                      : a .Symbol[] = i            .getProperties();

                    for ( const o              of k                       ) {
                        if ( Ast.H              ( o              ) ) {
                            h                    .push( o              );
                        }
                    }
                }
            }
        }

        let l               = (<a .ClassLikeDeclaration>f         ).heritageClauses;
        
        if ( l               ) {
            for ( const p              of l               ) {
                f                          ( p             , g       );
            } 
        }

        return h                    ;
    }

    export function u                         ( c            : a .HeritageClause, d      : a .TypeChecker ): a .Symbol[] {
        let e                 : a .Symbol[] = [];
        
        const f                 = c            .types;

        for ( const g                of f                 ) {
            const h           : a .Type = d      .getTypeAtLocation( g                );
            let i                  = h           .getSymbol();
       
            if ( i                 .valueDeclaration ) {
                if ( b                      ( i                 .valueDeclaration ) & a .ModifierFlags.Abstract ) {
                    const j    : a .Symbol[] = h           .getProperties();

                    for ( const k    of j     ) {
                        e                 .push( k    );
                    }
                }
            }
        }
        
        return e                 ;
    }

    export function w                      ( b               : a .HeritageClause, c      : a .TypeChecker ): a .Symbol[] {
        let d                   : a .Symbol[] = [];
        
        const e         = b               .types;

        for ( const f        of e         ) {
            const g   : a .Type = c      .getTypeAtLocation( f        );
            const h    : a .Symbol[] = g   .getProperties();

            for ( const i    of h     ) {
                d                   .push( i    );
            }
        }
        
        return d                   ;
    }

    export function x               ( b     : a .Symbol ): string {
        if ( !b      ) {
            return undefined;
        }

        let c  = ( <any>b      ).id;

        // Try to get the symbol id from the identifier value declaration
        if ( c  === undefined && b     .valueDeclaration ) {
            c  = ( <any>b     .valueDeclaration ).symbol.id;
        }

        return c  ? c .toString() : undefined;
    }

    export function y                ( b   : a .Node ): ContainerFlags {
        switch ( b   .kind ) {
            case a .SyntaxKind.ClassExpression:
            case a .SyntaxKind.ClassDeclaration:
            case a .SyntaxKind.EnumDeclaration:
            case a .SyntaxKind.ObjectLiteralExpression:
            case a .SyntaxKind.TypeLiteral:
            case a .SyntaxKind.JSDocTypeLiteral:
            case a .SyntaxKind.JsxAttributes:
                return ContainerFlags.IsContainer;

            case a .SyntaxKind.InterfaceDeclaration:
                return ContainerFlags.IsContainer | ContainerFlags.IsInterface;

            case a .SyntaxKind.ModuleDeclaration:
            case a .SyntaxKind.TypeAliasDeclaration:
            case a .SyntaxKind.MappedType:
                return ContainerFlags.IsContainer | ContainerFlags.HasLocals;

            case a .SyntaxKind.SourceFile:
                return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals;

            case a .SyntaxKind.MethodDeclaration:
                if ( m                                     ( b    ) ) {
                    return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals | ContainerFlags.IsFunctionLike | ContainerFlags.IsObjectLiteralOrClassExpressionMethod;
                }
            // falls through
            case a .SyntaxKind.Constructor:
            case a .SyntaxKind.FunctionDeclaration:
            case a .SyntaxKind.MethodSignature:
            case a .SyntaxKind.GetAccessor:
            case a .SyntaxKind.SetAccessor:
            case a .SyntaxKind.CallSignature:
            case a .SyntaxKind.JSDocFunctionType:
            case a .SyntaxKind.FunctionType:
            case a .SyntaxKind.ConstructSignature:
            case a .SyntaxKind.IndexSignature:
            case a .SyntaxKind.ConstructorType:
                return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals | ContainerFlags.IsFunctionLike;

            case a .SyntaxKind.FunctionExpression:
            case a .SyntaxKind.ArrowFunction:
                return ContainerFlags.IsContainer | ContainerFlags.IsControlFlowContainer | ContainerFlags.HasLocals | ContainerFlags.IsFunctionLike | ContainerFlags.IsFunctionExpression;

            case a .SyntaxKind.ModuleBlock:
                return ContainerFlags.IsControlFlowContainer;
            case a .SyntaxKind.PropertyDeclaration:
                return ( <a .PropertyDeclaration>b    ).initializer ? ContainerFlags.IsControlFlowContainer : 0;

            case a .SyntaxKind.CatchClause:
            case a .SyntaxKind.ForStatement:
            case a .SyntaxKind.ForInStatement:
            case a .SyntaxKind.ForOfStatement:
            case a .SyntaxKind.CaseBlock:
                return ContainerFlags.IsBlockScopedContainer;

            case a .SyntaxKind.Block:
                // do not treat blocks directly inside a function as a block-scoped-container.
                // Locals that reside in this block should go to the function locals. Otherwise 'x'
                // would not appear to be a redeclaration of a block scoped local in the following
                // example:
                //
                //      function foo() {
                //          var x;
                //          let x;
                //      }
                //
                // If we placed 'var x' into the function locals and 'let x' into the locals of
                // the block, then there would be no collision.
                //
                // By not creating a new block-scoped-container here, we ensure that both 'var x'
                // and 'let x' go into the Function-container's locals, and we do get a collision
                // conflict.
                return g             ( b   .parent ) ? ContainerFlags.None : ContainerFlags.IsBlockScopedContainer;
        }

        return ContainerFlags.None;
    }

    export function z                  ( b   : a .Node ): a .HeritageClause {
        if ( b    ) {
            let c               = (<a .ClassLikeDeclaration>b   ).heritageClauses;
            
            if ( c               ) {
                for ( const d      of c               ) {
                    if ( d     .token === a .SyntaxKind.ImplementsKeyword ) {
                        return d     ;
                    }
                }
            }
        }

        return undefined;
    }

    export function A               ( b   : a .Node ): a .HeritageClause {
        if ( b    ) {
            let c               = (<a .ClassLikeDeclaration>b   ).heritageClauses;
            
            if ( c               ) {
                for ( const d      of c               ) {
                    if ( d     .token === a .SyntaxKind.ExtendsKeyword ) {
                        return d     ;
                    }
                }
            }
        }

        return undefined;
    }

    export function B        ( b    : a .SyntaxKind ): boolean {
        return a .SyntaxKind.FirstKeyword <= b     && b     <= a .SyntaxKind.LastKeyword;
    }

    export function F           ( b    : a .SyntaxKind ): boolean {
        return a .SyntaxKind.FirstPunctuation <= b     && b     <= a .SyntaxKind.LastPunctuation;
    }

    export function G       ( b    : a .SyntaxKind ) {
        return a .SyntaxKind.FirstTriviaToken <= b     && b     <= a .SyntaxKind.LastTriviaToken;
    }

    export function H              ( b             : a .Symbol ): boolean {
        let c   : a .Node = b             .valueDeclaration;

        // TJT: Same code. Remove

        //while ( node ) {
        //    if ( getModifierFlags( node ) & ts.ModifierFlags.Export ) {
        //        return true;
        //    }
        //    node = node.parent;
        //}
        while ( c    ) {
            if ( c   .flags & a .NodeFlags.ExportContext ) {
                return true;
            }
            c    = c   .parent;
        }
        
        return false;
    }

    export function I               ( c             : a .Symbol ): boolean {
        let d   : a .Node = c             .valueDeclaration;
        while ( d    ) {
            if ( b                      ( d    ) & a .ModifierFlags.Ambient ) {
                return true;
            }
            d    = d   .parent;
        }
        
        return false;
    }

    export function J               ( c   : a .SourceFile ): boolean {
        return ( c   .kind === a .SyntaxKind.SourceFile && !c   .isDeclarationFile );
    }
}
                                                                                                                                                                                                                                                                                                                                                  class z    {

    public a         ( b      : string ) {
        var g = new k       .Glob( b       );
        var c            = g.minimatch.set;

        if ( c           .length > 1 )
            return true;

        for ( var j = 0; j < c           [0].length; j++ ) {
            if ( typeof c           [0][j] !== 'string' )
                return true;
        }

        return false;
    }

    public b     ( f       : string[], g   : string ): string[]{

        if ( f       .length === 0 ) {
            return [];
        }

        var h       = this.e              ( f       , function ( a      : string ) {
            return k       .sync( a      , { root: g    } );
        });

        return h      ;
    }

    private e              ( f       : string[], g : any ): string[] {
        var h     : string[] = [];

        _.flatten( f        ).forEach( function ( b      : any ) {
            var c        : any;
            var a      : any;

            c         = _.isString( b       ) && b      .indexOf( "!" ) === 0;

            if ( c         ) {
                b       = b      .slice( 1 );
            }

            a       = g ( b       );

            if ( c         ) {
                return h      = _.difference( h     , a       );
            } else {
                return h      = _.union( h     , a       );
            }
        });

        return h     ;
    }
}
                                            interface BundleFile {
    path: string,
    extension: string,
    text: string
}           class A            {

    private b     : a .ExitStatus;
    private o     : a .Diagnostic[];
    private q           : BundleFile;

    constructor( c     : a .ExitStatus, d     ?: a .Diagnostic[], e           ?: BundleFile ) {
        this.b      = c     ;
        this.o      = d     ;
        this.q            = e           ;
    }
    
    public r              (): BundleFile {
        return this.q           ;
    }

    public s        (): a .Diagnostic[] {
        return this.o     ;
    }
    
    public t        (): a .ExitStatus {
        return this.b     ;
    }

    public u        (): boolean {
        return ( this.b      === a .ExitStatus.Success );
    }
}
                                                                                                                                                                                                                                                                           class B                 {
    private c   : a .CompilerHost;
    private f      : a .Program;
    private g      : a .CompilerOptions;
    private h                  : a .MapLike<a .Symbol[]> = {};

    constructor( b   : a .CompilerHost, d      : a .Program ) {
        this.c    = b   ;
        this.f       = d      ;
        this.g       = this.f      .getCompilerOptions();
    }

    public i                        ( b         : a .SourceFile ): a .MapLike<a .Node[]> {
        var f    = this;
        var g           : a .MapLike<a .Node[]> = {};
        var h           : a .MapLike<boolean> = {};

        function d                ( b          : a .Node[] ) {
            b          .forEach( b          => {
                // Get the import symbol for the import node
                let e            = f   .s                ( b          );
                let i                = f   .t                      ( e            );
                let j                 = f   .c   .getCanonicalFileName( i               .fileName );
                
                // Don't walk imports that we've already processed
                if ( !Utils.k          ( h           , j                 ) ) {
                    h           [ j                 ] = true;

                     // Build dependencies bottom up, left to right by recursively calling walkModuleImports
                    if ( !i               .isDeclarationFile ) {
                        n     .p   ( "Walking Import module: ", j                 );
                        d                ( f   .l                 ( i                ) );
                    }
                }

                if ( !Utils.k          ( g           , j                 ) ) {
                    n     .p   ( "Getting and adding imports of module file: ", j                 );
                    g           [ j                 ] = f   .l                 ( i                );
                }
            });
        }

        // Get the top level source file imports
        var o                 = f   .l                 ( b          );

        // Walk the module import tree
        d                ( o                 );

        let q                       = f   .c   .getCanonicalFileName( b         .fileName );

        if (!Utils.k          (g           , q                      )) {
            n     .p   ("Adding top level import dependencies for file: ", q                       );
            g           [ q                       ] = o                ;
        }

        return g           ;
    }

    public l                 ( c   : a .SourceFile ): a .Node[] {
        if ( !Ast.J               ( c    ) ) {
            return [];
        }
        
        var d          : a .Node[] = [];
        var e    = this;
        
        function h         ( g         : a .Node ) {
            a .forEachChild( g         , g    => {
                if (g   .kind === a .SyntaxKind.ImportDeclaration || g   .kind === a .SyntaxKind.ImportEqualsDeclaration || g   .kind === a .SyntaxKind.ExportDeclaration) {
                    let i              = TsCore.k                    ( g    );

                    if ( i              && i             .kind === a .SyntaxKind.StringLiteral ) {
                        let j            = e   .f      .getTypeChecker().getSymbolAtLocation( i              );

                        if ( j            ) {
                            n     .p   ("Adding import node: ", j           .name ) ;
                            d          .push( g    );
                        }
                        else {
                            n     .r   ("Module symbol not found");
                        }
                    }
                }
                else if ( g   .kind === a .SyntaxKind.ModuleDeclaration ) {
                    // For a namespace ( or module ), traverse the body to locate ES6 module dependencies.
                    // TJT: This section needs to be reviewed. Should namespace/module syntax kinds be scanned or
                    //      Do we only support ES6 import/export syntax, where dependencies must be declared top level?

                    const l                : a .ModuleDeclaration = <a .ModuleDeclaration>g   ;

                    if ( ( l                .name.kind === a .SyntaxKind.StringLiteral ) &&
                        ( Ast.b                      ( l                 ) & a .ModifierFlags.Ambient || c   .isDeclarationFile ) ) {
                        // An AmbientExternalModuleDeclaration declares an external module.
                        n     .p   ( "Scanning for dependencies within ambient module declaration: ", l                .name.text );

                        h         ( l                .body );
                    }
                }
            });
        };

        n     .p   ( "Getting imports for source file: ", c   .fileName );
        h         ( c    );

        return d          ;
    }

    private o                                      ( b   : a .Node ) {
        return b   .kind === a .SyntaxKind.ImportEqualsDeclaration && ( <a .ImportEqualsDeclaration>b    ).moduleReference.kind === a .SyntaxKind.ExternalModuleReference;
    }

    private q                                                 ( b   : a .Node ) {
        return ( <a .ExternalModuleReference>( <a .ImportEqualsDeclaration>b    ).moduleReference ).expression;
    }

    private s                ( b   : a .Node ): a .Symbol {
        let c              = TsCore.k                    ( b    );

        if ( c              && c             .kind === a .SyntaxKind.StringLiteral ) {
            return this.f      .getTypeChecker().getSymbolAtLocation( c              );
        }

        return undefined;
    }

    private t                      ( b           : a .Symbol ): a .SourceFile {
        let c           = b           .getDeclarations()[0];
        
        return c          .getSourceFile();
    }
}
                                                                                                                                                                                                                            class C              {

    private f         : a .Identifier;
    private g     : a .Symbol;

    private h         : a .MapLike<D        > = {};
    private l          : a .Identifier[] = [];

    public m            : string = undefined;

    public B         : boolean = false;

    constructor( b         : a .Identifier, c     : a .Symbol, d        : D         ) {
        this.f          = b         ;
        this.g      = c     ;
        this.l           = [b         ];
        this.h         [d        .e    ().toString()] = d        ;
    }

    public G        (): a .Symbol {
        return this.g     ;
    }

    public J      (): string {
        return this.g     .name;
    }

    public K    (): string {
        let b  = ( <any>this.g      ).id;

        if ( b  === undefined && this.g     .valueDeclaration ) {
            b  = ( <any>this.g     .valueDeclaration ).symbol.id;
        }

        return b  ? b .toString() : undefined;
    }

    public L            (): a .MapLike<D        > {
        return this.h         ;
    }

    public M             (): a .Identifier[] {
        return this.l          ;
    }

    public N     ( b         : a .Identifier, c        : D         ): void {
        // Add the identifier (node) reference
        this.l          .push( b          );

        // We only need to keep track of a single reference in a container
        if ( !Utils.k          ( this.h         , c        .e    ().toString() ) ) {
            this.h         [ c        .e    ().toString() ] = c        ;
        }
    }

    public O                     (): boolean {
        if ( ( this.g     .flags & a .SymbolFlags.Alias ) > 0 ) {
            if ( this.g     .declarations[0].kind === a .SyntaxKind.NamespaceImport ) {
                return true;
            }
        }

        return false;
    }

    public P                       (): boolean {
        if ( ( this.g     .flags & a .SymbolFlags.FunctionScopedVariable ) > 0 ) {
            let b                   = this.X                     ();

            if ( b                   ) {
                return true;
            }
        }

        return false;        
    }

    public Q                    (): boolean {
        if ( ( this.g     .flags & a .SymbolFlags.BlockScopedVariable ) > 0 ) {
            let b                   = this.X                     ();

            if ( b                   ) {
                return ( ( b                  .parent.flags & a .NodeFlags.Let ) !== 0 ) ||
                    ( ( b                  .parent.flags & a .NodeFlags.Const ) !== 0 );
            }
        }

        return false;
    }

    public R          (): boolean {
        // Note: FunctionScopedVariable also indicates a parameter
        if ( ( this.g     .flags & a .SymbolFlags.FunctionScopedVariable ) > 0 ) {

            // A parameter has a value declaration
            if ( this.g     .valueDeclaration.kind === a .SyntaxKind.Parameter ) {
                return true;
            }
        }

        return false;
    }

    public S              (): boolean {
        // TJT: Review - should use the same export "override" logic as in isInternalFunction
        return Ast.q              ( this.g      );
    }

    public T                  (): boolean {
        return Ast.o                  ( this.g      );
    }

    public U                 ( c               : string ): boolean {
        if ( this.g     .flags & a .SymbolFlags.Function ) {

            // A function has a value declaration
            if ( this.g     .valueDeclaration.kind === a .SyntaxKind.FunctionDeclaration ) {
                let d     = Ast.b                      ( this.g     .valueDeclaration );

                // If the function is from an extern API or ambient then it cannot be considered internal.
                if ( Ast.H              ( this.g      ) || Ast.I               ( this.g      ) ) {
                    return false;
                }

                if ( !( d     & a .ModifierFlags.Export ) ) {
                    return true;
                }

                // Override export flag if function is not in our special package namespace.
                if ( c                ) {
                    let e   : a .Node = this.g     .valueDeclaration;
                    while ( e    ) {
                        if ( e   .flags & a .NodeFlags.Namespace ) {
                            let f                : string = (<any>e   ).name.text;

                            if ( f                 !== c                ) {
                                return true;
                            }
                        }
                        e    = e   .parent;
                    }
                }
            }
        }

        return false;
    }

    public V              (): boolean {
        if ( ( this.g     .flags & a .SymbolFlags.Method ) > 0 ) {
            
            // We explicitly check that a method has a value declaration.
            if ( this.g     .valueDeclaration === undefined ) {
                return false;
            }

            let c     = Ast.b                      ( this.g     .valueDeclaration );

            if ( ( c     & a .ModifierFlags.Private ) > 0 ) {
                return true;
            }

            // Check if the method parent class or interface is "internal" ( non-private methods may be shortened too )
            let d     : a .Symbol = ( <any>this.g      ).parent;

            if ( d      && Ast.q              ( d      ) ) {
                
                // TJT: Review - public methods of abstact classes are not shortened.
                if ( !Ast.s              ( d      ) ) {
                    return true;
                }
            }

            if ( d      && Ast.o                  ( d      ) ) {
                // TODO: Interfaces methods are always external for now.
                return false;
            }
        }

        return false;
    }

    public W                (): boolean {
        if ( ( this.g     .flags & a .SymbolFlags.Property ) > 0 ) {
            
            // A property has a value declaration except when it is the "prototype" property.
            if ( this.g     .valueDeclaration === undefined ) {
                return false;
            }

            let c     = Ast.b                      ( this.g     .valueDeclaration );

            if ( ( c     & a .ModifierFlags.Private ) > 0 ) {
                return true;
            }

            // Check if the property parent class is "internal" ( non-private properties may be shortened too )
            let d     : a .Symbol = ( <any>this.g      ).parent;

            if ( d      && Ast.q              ( d      ) ) {
                
                // TJT: Review - public properties of abstact classes are not shortened.
                if ( !Ast.s              ( d      ) ) {
                    return true;
                }
            }
        }

        return false;
    }

    private X                     (): a .VariableDeclaration {
        switch ( ( <a .Node>this.f          ).parent.kind ) {
            case a .SyntaxKind.VariableDeclaration:
                return <a .VariableDeclaration>this.f         .parent;

            case a .SyntaxKind.VariableDeclarationList:
                n     .r   ( "VariableDeclaratioList in getVariableDeclaration() - returning null" );
                break;

            case a .SyntaxKind.VariableStatement:
                n     .r   ( "VariableStatement in getVariableDeclaration() - returning null" );
                break;
        }

        return null;
    }
}
                                                                                                                                                                                                                    

class E                    {
    static b      = 1;

    static c        (): number {
        return this.b     ++;
    }
}           class D         {

    private b : number;

    private d        : a .Node;
    private f              : D        ;
    public g            : D        ;

    private h     : a .SymbolTable;

    private l                  : a .Node;
    private o             : Ast.ContainerFlags;

    private q     : D        ;
    private s              : D        [] = [];

    private F           : boolean;

    // The base class cannot be determined by the checker if the base class name has been shortened
    // so we use get and set for the baseClass property
    private H        : a .Symbol = undefined;
    
    private I        : number;
    public N            : a .MapLike<boolean> = {};

    public O               : a .MapLike<C             > = {};
    public P                  : a .MapLike<a .Symbol> = {};

    public R                  : a .MapLike<C             > = {};
    public S                 : a .Symbol[] = [];

    public T                        = 0;

    constructor( e   : a .Node ) {
        this.b  = E                   .c        ();
        this.o              = Ast.y                ( e    );

        if ( this.o              & Ast.ContainerFlags.IsBlockScopedContainer ) {
            this.l                   = e   ;
            this.F            = true;

            // A block scoped container's parent is the parent function scope container.
            // this.parent = parentContainer.getParent();
        }
        else {
            // Function scoped container...
            this.d         = this.l                   = e   ;
            this.F            = false;

            // A function scoped container is it's own parent
            this.q      = this;
        }

        // The name generator index starts at 0 for containers 
        this.I         = 0;
    }

    public e    (): number {
        return this.b ;
    }

    public U                ( a        : D         ): void {
        this.s              .push( a         );
    }

    public V          (): D        [] {
        return this.s              ;
    }

    public W        (): D         {
        return this.q     ;
    }

    public X           (): number {
        // TJT: This logic needs to be reviewed for applicability to ES6 block scopes
        if ( this.F            ) {
            // The name generator index for block scoped containers is obtained from the parent container
            return this.q     .X           ();
        }

        return this.I        ++;
    }

    public Y      (): a .Node {
        return this.F            ? this.l                   : this.d        ;
    }

    public Z         (): a .NodeArray<a .Declaration> {
        if ( this.d         ) {
            switch ( this.d        .kind ) {
                case a .SyntaxKind.ClassDeclaration:
                    return (<a .ClassDeclaration>this.d        ).members;

                case a .SyntaxKind.EnumDeclaration:
                    return (<a .EnumDeclaration>this.d        ).members;

                default:
                    n     .v    ( "Container::getMembers() unprocessed container kind: ", this.d        .kind, this.e    () );
            }
        }

        return undefined;
    }

    public $        (): a .SymbolTable {
        if ( this.d         && this.o              & Ast.ContainerFlags.HasLocals ) {
            switch ( this.d        .kind ) {
                case a .SyntaxKind.ModuleDeclaration:
                    return (<any>this.d        ).locals;
                default:
                    n     .r   ( "Container::getLocals() unprocessed container kind: ", this.d        .kind, this.e    () );
            }
        }

        return undefined;
    }

    public _            (): boolean {
        return this.F           ;
    }

    public ab              (): boolean {
        if ( this.o              & ( Ast.ContainerFlags.IsContainer | Ast.ContainerFlags.IsContainerWithLocals ) ) {
            return true;
        }

        return false;
    }

    public bb          ( b        : a .Symbol ): void {
        if ( b        .flags & a .SymbolFlags.Class ) {
            this.H         = b        ;
        }
    }

    public cb          (): a .Symbol {
        return this.H        ;
    }

    public db      ( a        : D         ): boolean {
        for ( let i = 0; i < this.s              .length; i++ ) {
            if ( a        .e    () === this.s              [ i ].e    () )
                return true;
        }

        return false;
    }
}
       class F             {
    // Base64 char set: 26 lowercase letters + 26 uppercase letters + '$' + '_' + 10 digits                                          
    private b           = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_0123456789";

    public f      ( a    : number ): string {
        // 2 and 3 letter reserved words that cannot be used in identifier names
        const b                : string[] = ["do", "if", "in", "for", "int", "let", "new", "try", "var"];
        let c   : any;

        while ( true ) {
            c    = this.h           ( a    ++ );

            if ( b                .indexOf( c    ) > 0 ) {
                continue;
            }
            else {
                return c   ;
            }
        }
    }

    private h           ( a    : number ): string {
        let c  = a    ;
        // The first 54 chars of the base64 char set are used for the first char of the identifier
        let d   : string = this.b          [c  % 54];
        c  = Math.floor( c  / 54 );

        while ( c  > 0 ) {
            // The full base64 char set is used after the first char of the identifier
            d    += this.b          [c  % 64];
            c  = Math.floor( c  / 64 );
        }

        return d   ;
    }
}

       namespace Debug {
    export function a     ( b        : boolean, c      ?: string ) {
        if ( !b         ) {
            c       = c       || "Assertion failed";

            if ( typeof Error !== "undefined" ) {
                throw new Error( c       );
            }

            throw c      ;
        }
    }
}
                                                                                     function h     ( f    : string ): string {
    //var settings = getDefaultFormatCodeSettings();

    const g          = a .createSourceFile( "file.js", f    , a .ScriptTarget.Latest );

    // Get the formatting edits on the input sources
    //var edits = ( ts as any ).formatting.formatDocument( sourceFile, getRuleProvider( settings ), settings );

    return l       .format(g         .getText(), { parser: "typescript" } );

    //function getRuleProvider( settings: ts.FormatCodeSettings ) {
    //    var ruleProvider = new ( <any>ts ).formatting.RulesProvider();
    //    ruleProvider.ensureUpToDate( settings );

    //    return ruleProvider;
    //}

    //function applyEdits( text: string, edits: ts.TextChange[] ): string {
    //    let result = text;

    //    for ( let i = edits.length - 1; i >= 0; i-- ) {
    //        let change = edits[i];
    //        let head = result.slice( 0, change.span.start );
    //        let tail = result.slice( change.span.start + change.span.length );

    //        result = head + change.newText + tail;
    //    }

    //    return result;
    //}

    //function getDefaultFormatCodeSettings(): ts.FormatCodeSettings {
    //    return {
    //        baseIndentSize: 4,
    //        indentSize: 4,
    //        tabSize: 4,
    //        newLineCharacter: "\r\n",
    //        convertTabsToSpaces: true,
    //        indentStyle: ts.IndentStyle.Smart,

    //        insertSpaceAfterCommaDelimiter: true,
    //        insertSpaceAfterSemicolonInForStatements: true,
    //        insertSpaceBeforeAndAfterBinaryOperators: true,
    //        insertSpaceAfterConstructor: true,
    //        insertSpaceAfterKeywordsInControlFlowStatements: true,
    //        insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
    //        insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
    //        insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
    //        insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: false,
    //        insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
    //        insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: false,
    //        insertSpaceAfterTypeAssertion: false,
    //        insertSpaceBeforeFunctionParenthesis: false,
    //        placeOpenBraceOnNewLineForFunctions: false,
    //        placeOpenBraceOnNewLineForControlBlocks: false,
    //    };
    //}
}

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              class G              {
    private b               : a .SourceFile;
    private q      : a .TypeChecker;
    private s              : TsCompilerOptions;
    private y           : BundleConfig;

    private H            : D        ;
    private I             : D        [] = [];
    private _                     : a .MapLike<D        > = {};
    private ab                : a .MapLike<C             > = {};
    private bb                 : D        ;
    private db           : F            ;

    private eb              = 0;
    private fb                       = 0;

    private gb           : number;

    constructor( b      : a .Program, c              : a .CompilerOptions, d           : BundleConfig ) {
        this.q       = b      .getTypeChecker();
        this.s               = c              ;
        this.y            = d           ;

        this.I              = [];
        this.db            = new F            ();
    }

    public hb       ( e               : a .SourceFile ): a .SourceFile {

        return this.b                = e               ;

        //return this.minify( bundleSourceFile );
    }

    private ib                 ( a            : D         ) {
        if ( this.H             ) {
            this.H            .g             = a            ;
        }

        this.H             = a            ;
    }

    public jb                ( b   : Ast.ContainerNode ) {
        var c                    = b   ;

        while ( c                    ) {
            var d         = new D        ( c                    );

            this.ib                 ( d         );

            // Get the next container node (if any)
            c                    = c                   .nextContainer;
        }
    }

    //protected visitNode( node: ts.Node ): void {
    //    // Traverse nodes to build containers and process all identifiers nodes.
    //    if ( this.isNextContainer( node ) ) {
    //        super.visitNode( node );

    //        //this.restoreContainer();
    //    }
    //    else {
    //        switch ( node.kind ) {
    //            case ts.SyntaxKind.Identifier:
    //                Logger.info( "Identifier node walked in container id: ", this.currentContainer().getId() );

    //                let identifier: ts.Identifier = <ts.Identifier>node;
    //                let identifierSymbol: ts.Symbol = this.checker.getSymbolAtLocation( identifier );

    //                // The identifierSymbol may be null when an identifier is accessed within a function that
    //                // has been assigned to the prototype property of an object. We check for this here.
    //                if ( !identifierSymbol ) {
    //                    identifierSymbol = this.getSymbolFromPrototypeFunction( identifier );    
    //                }
                   
    //                if ( identifierSymbol ) {
    //                    let identifierUID = Ast.getIdentifierUID( identifierSymbol );

    //                    if ( identifierUID === undefined ) {
    //                        if ( identifierSymbol.flags & ts.SymbolFlags.Transient ) {
    //                            // TJT: Can we ignore all transient symbols?
    //                            Logger.trace( "Ignoring transient symbol: ", identifierSymbol.name );
    //                            break;
    //                        }
    //                        else {
    //                            identifierUID = ( <any>ts).getSymbolId( identifierSymbol ).toString();
    //                            Logger.trace( "Generated symbol id for: ", identifierSymbol.name, identifierUID );
    //                        }
    //                    }

    //                    // Check to see if we've seen this identifer symbol before
    //                    if ( Utils.hasProperty( this.allIdentifierInfos, identifierUID ) ) {
    //                        Logger.info( "Identifier already added: ", identifierSymbol.name, identifierUID );

                            
    //                        // If we have, then add it to the identifier info references 
    //                        let prevAddedIdentifier = this.allIdentifierInfos[identifierUID];

    //                        if ( prevAddedIdentifier.getName() === 'getClassHeritageProperties' ) {
    //                            var breakme4 = 1;

    //                            var s = prevAddedIdentifier.getSymbol();
    //                            var mems = s.members;
    //                            var decl = s.valueDeclaration;
    //                            var cont = ( <any>s.valueDeclaration ).nextContainer;
    //                        }

                            
                            
    //                        this.allIdentifierInfos[ identifierUID ].addRef( identifier, this.currentContainer() );

    //                        // If the previously added identifier is not in the current container's local identifier table then
    //                        // it must be excluded so that it's shortened name will not be used in this container.
    //                        if ( !Utils.hasProperty( this.currentContainer().localIdentifiers, identifierUID ) ) {
    //                            this.currentContainer().excludedIdentifiers[ identifierUID ] = prevAddedIdentifier; 
    //                        }
    //                    }
    //                    else {
    //                        let identifierInfo = new IdentifierInfo( identifier, identifierSymbol, this.currentContainer() );
                            
    //                        if ( identifierInfo.getName() === 'getClassHeritageProperties' ) {
    //                            var breakme4 = 1;
    //                        }
    //                        if ( identifierInfo.getName() === 'classNodeU' ) {
    //                            var breakme4 = 1;
    //                        }
    //                        if ( identifierInfo.getName() === 'classExportProperties' ) {
    //                            var breakme4 = 1;
    //                        }
    //                        if ( identifierInfo.getName() === 'getHeritageExportProperties' ) {
    //                            var breakme4 = 1;
    //                        }
    //                        Logger.info( "Adding new identifier: ", identifierInfo.getName(), identifierInfo.getId() );

    //                        // Add the new identifier info to both the container and the all list
    //                        this.currentContainer().localIdentifiers[ identifierUID ] = identifierInfo;
    //                        this.allIdentifierInfos[ identifierUID ] = identifierInfo;

    //                        // We can't shorten identifier names that are 1 character in length AND
    //                        // we can't risk the chance that an identifier name will be replaced with a 2 char
    //                        // shortened name due to the constraint that the names are changed in place
    //                        let identifierName = identifierSymbol.getName();

    //                        if ( identifierName.length === 1 ) {
    //                            identifierInfo.shortenedName = identifierName;
    //                            this.currentContainer().excludedIdentifiers[ identifierUID ] = identifierInfo;
    //                        }

    //                        this.identifierCount++;
    //                    }
    //                }
    //                else {
    //                    Logger.warn( "Identifier does not have a symbol: ", identifier.text );
    //                }

    //                break;
    //        }

    //        super.visitNode( node );
    //    }
    //}

    //private getSymbolFromPrototypeFunction( identifier: ts.Identifier ): ts.Symbol {

    //    let containerNode = this.currentContainer().getNode();

    //    if ( containerNode.kind === ts.SyntaxKind.FunctionExpression ) {
    //        if ( Ast.isPrototypeAccessAssignment( containerNode.parent ) ) {
    //            // Get the 'x' of 'x.prototype.y = f' (here, 'f' is 'container')
    //            const className = (((containerNode.parent as ts.BinaryExpression)   // x.prototype.y = f
    //                .left as ts.PropertyAccessExpression)       // x.prototype.y
    //                .expression as ts.PropertyAccessExpression) // x.prototype
    //                .expression;                                // x
                        
    //            const classSymbol = this.checker.getSymbolAtLocation( className );

    //            if ( classSymbol && classSymbol.members ) {
    //                if ( classSymbol.members.has( identifier.escapedText ) ) {
    //                    Logger.info( "Symbol obtained from prototype function: ", identifier.text );
    //                    return classSymbol.members.get( identifier.escapedText );
    //                }
    //            }

    //            return undefined;
    //        }                            
    //    }
        
    //    return undefined;        
    //}

    private kb    ( b         : a .SourceFile ): a .SourceFile {
        this.gb            = new Date().getTime();

        // Walk the sourceFile to build containers and the identifiers within. 
        //this.walk( sourceFile );

        this.lb                ();

        this.gb            = new Date().getTime() - this.gb           ;

        if ( this.s              .diagnostics )
            this.wb                    ();

        return b         ;
    }

    private lb                (): void {
        // NOTE: Once identifier names are shortened, the typescript checker cannot be used. 

        // We first need to process all the class containers to determine which properties cannot be shortened 
        // ( public, abstract, implements, extends ).

        for ( let b                 in this._                      ) {
            let c              = this._                     [ b                 ];

            let d                 : a .Symbol[] = [];
            let f                 : a .Symbol[] = [];
            let g                   : a .Symbol[] = [];

            let h             = Ast.A               ( c             .Y      () );

            if ( h             ) {
                // Check for abstract properties...
            
                // TODO: Abstract properties are currently not shortened, but they could possibly be.
                //       The child class that implements a parent class property would need to have the same shortened name.
                
                d                  = Ast.u                         ( h            , this.q       );
            }

            let i                = Ast.z                  ( c             .Y      () );

            if ( i                ) {
                g                    = Ast.w                      ( i               , this.q       );
            }

            f                  = Ast.t                         ( c             .Y      (), this.q       );

            // Join the abstract and implements properties
            let k                  = f                 .concat( d                 , g                    );

            n     .v    ( "Class excluded properties for: ", (<any>c             .Y      ()).name.text, k                 .length, c             .e    () );

            c             .S                  = k                 ;
        }

        // Recursively process the container identifiers starting at the source file container...
        this.mb                         ( this.bb                  );
    }

    private mb                         ( b        : D         ): void {
        // If this container extends a base/parent class then we must make sure we have processed the base/parent class members
        let c         = b        .cb          ();

        if ( c         ) {
            // We need to get the container for the parent/base class
            let g                  = this._                     [ c        .name ];

            if ( g                  ) {
                let h                = g                 .Z         ();
                
                if ( h                ) {
                    this.sb                 ( h               , g                  );

                    // The base class container excludedProperties array must also be excluded in the current derived class
                    b        .S                  = b        .S                 .concat( g                 .S                  );
                }
            }
        }

        // Determine the names which cannot be used as shortened names in this container.
        this.tb          ( b         );

        // Process container members..
        let d                     = b        .Z         ();
        
        if ( d                     ) {
            this.sb                 ( d                    , b         );
        }

        // Process container locals..
        let e               = b        .$        ();
        if ( e               ) {
            this.rb                    ( e              , b         );
        }

        // Process the containers identifiers...
        for ( let i                  in b        .O                ) {
            let k              = b        .O               [ i                  ];

            this.nb                   ( k             , b         );
        }

        // Process the containers classifiables...
        
        // TJT: Review..

        for ( let l               in b        .P                   ) {
            let m           = b        .P                  [ l               ];

            let n             : string = Ast.x               ( m           );
            let o                   = this.ab                [ n              ];
            
            this.nb                   ( o                  , b         );
        }

        // Recursively go through container children in order added
        let f                 = b        .V          ();

        for ( let j = 0; j < f                .length; j++ ) {
            this.mb                         ( f                [j] );
        }
    }

    private nb                   ( a             : C             , b        : D         ): void {
        if ( a             .J      () === 'classNodeU' ) {
            var d        = 1;
        }
        if ( a             .J      () === 'getHeritageExportProperties' ) {
            var d        = 1;
        }

        if ( a             .B          ) {
            n     .v    ( "Identifier already has shortened name: ", a             .J      (), a             .m             ); 
            return;
        }

        if ( this.ob                  ( a              ) ) {
            let e             = this.pb                        ( b        , a              );

            n     .v    ( "Identifier shortened: ", a             .J      (), e             );

            // Add the shortened name to the excluded names in each container that this identifier was found in.
            let g             = a             .L            ();
            
            for ( let h            in g             ) {
                let i            = g            [ h            ];
                i           .N            [ e             ] = true;
            }

            //if ( !identifierInfo.isMinified ) {
                // Change all referenced identifier nodes to the shortened name
                Utils.c      ( a             .M             (), c          => {
                    this.qb               ( c         , e             );
                } );

                a             .B          = true;
            //}

            return;
        }
    }

    private ob                  ( a             : C              ): boolean {

        if ( a             .Q                    () ||
            a             .P                       () ||
            a             .S              () ||
            a             .T                  () ||
            a             .V              () ||
            a             .W                () ||
            a             .U                 ( this.y           .package.e                  () ) ||
            a             .R          () ||
            a             .O                     () ) {

            n     .v    ( "Identifier CAN be shortened: ", a             .J      () );
            return true;
        }

        n     .v    ( "Identifier CANNOT be shortened: ", a             .J      () );
        return false;
    }

    private pb                        ( b        : D        , c             : C              ): string {
        // Identifier names are shortened in place. They must be the same length or smaller than the original name.
        if ( !c             .m             ) {
            let d              = c             .J      ();

            if ( d             .length === 1 ) {
                // Just reuse the original name for 1 char names
                c             .m             = d             ;
            }
            else {
                // Loop until we have a valid shortened name
                // The shortened name MUST be the same length or less
                while ( !c             .m             ) {
                    let e             = this.db           .f      ( b        .X           () );

                    Debug.a     ( e            .length <= d             .length );

                    let g             = c             .L            ();
                    let h                          = false;

                    for ( let i            in g             ) {
                        let j            = g            [i           ];

                        if ( Utils.k          ( j           .N            , e             ) ) {
                            h                          = true;
                            n     .v    ( "Generated name was excluded: ", e            , d              );
                            break;
                        }
                    }

                    if ( !h                          ) {
                        c             .m             = e            ;
                    }
                }

                this.fb                      ++;
            }
        }
        else {
            n     .v    ( "Identifier already has shortened name: ", c             .J      (), c             .m             ); 
        }

        n     .p   ( "Identifier shortened name: ", c             .J      (), c             .m             ); 
        
        return c             .m            ;
    }

    private qb               ( c         : a .Identifier, f   : string ): void {
        
        let g                = c         .text.length;
        let h            = ( c         .end - c         .pos );

        // Check to see if there is leading trivia
        var j            = c         .getLeadingTriviaWidth();

        // Find the start of the identifier text within the identifier character array
        for ( var k               = c         .pos + j           ; k               < c         .pos + h           ; k              ++ ) {
            if ( this.b               .text[ k               ] === c         .text[ 0 ] )
                break;
        }

        // Replace the identifier text within the bundle source file
        c         .end = k               + f   .length;

        for ( var i = 0; i < g               ; i++ ) {
            let l           = " ";
            
            if ( i < f   .length ) {
                l           = f   [i];
            }

            this.b               .text = Utils.E        ( this.b               .text, k               + i, l           );
        }
    }

    private rb                    ( b     : a .SymbolTable, c        : D         ): void {
        b     .forEach( a     => {
            let b             : string = Ast.x               (( <any>a    .declarations[0] ).symbol );

            if ( b              ) {
                let d                   = this.ab                [b             ];
                this.nb                   ( d                  , c         );
            }
            else {
                n     .r   ( "Container local does not have a UId" );
            }
        });
    }

    private sb                 ( b      : a .NodeArray<a .Declaration>, c        : D         ): void {
        for ( let d         in b       ) {
            let e      = b      [ d         ];
            let f           : a .Symbol = (<any>e     ).symbol;
            
            if ( f            ) {
                let g              : string = Ast.x               ( f            );

                if ( g               ) {
                    let h                    = this.ab                [ g               ];
                    let i                  = false;

                    for ( const j                   in c        .S                  ) {
                        let k                      = h                   .G        ();
                        let l                      = c        .S                 [ j                   ];
                       
                        // TJT: Review - How to determine equality here. For now just use name which seems pretty naive.
                        if ( k                     .name === l                     .name ) {
                            i                  = true;
                            
                            h                   .m             = h                   .J      ();
                            break;
                        }
                    }

                    if ( !i                  ) {
                        this.nb                   ( h                   , c         );
                    }
                }
                else {
                    n     .r   ( "Container member does not have a UId" );
                }
            }
            else {
                n     .r   ( "Container member does not have a symbol." );
            }
        }
    }
    
    public tb          ( b        : D         ): void {
        // Determine identifier names which cannot be used in this container.

        // If this container extends a base/parent class then we exclude the base class member names.
        let c         = b        .cb          ();

        if ( c         ) {

            // We need to get the container for the parent/base class
            let d                  = this._                     [ c        .name ];

            if ( d                  ) {
                let e                = d                 .Z         ();

                if ( e                ) {

                    // The base class members shortened names must be excluded from this child class
                    for ( let f         in e                ) {
                        let g      = e               [ f         ];
                        let h            = (<any>g     ).symbol;
                        let i              : string = Ast.x               ( h            );

                        let j                  = this.ab                [ i               ] ;

                        if ( j                  && j                 .m             ) {
                            b        .N            [ j                 .m             ] = true;
                        }
                    }
                }
            }
        }

        for ( let k                 in b        .O                ) {
            let l              = b        .O               [ k                 ];
            
            this.vb                       ( l             , b         );
        }

        for ( let n               in b        .P                   ) {
            let o           = b        .P                  [ n               ];

            let p             : string = Ast.x               ( o           );
            let q                   = this.ab                [ p              ];
            
            Debug.a     ( q                   !== undefined, "Container classifiable identifier symbol not found." );

            this.vb                       ( q                  , b         );
        }
    }

    private ub                             ( b        : D         ): a .MapLike<C             > {
        if ( b        .e    () === 206 ) {
            var h       = 4;
        }

        // Recursively walk the container chain to find shortened identifier names that we cannot use in this container.
        let f      = this.s              .target;
        let g       : a .MapLike<C             > = {};
        
        function d                   ( b        : D         ) {
            // Recursively process the container block scoped children..
            let c                 = b        .V          ();
           
            for ( let i = 0; i < c                .length; i++ ) {
                let e              = c                [i];

                // TJT: Review. Comments added in release 2.0
                //if ( childContainer.isBlockScoped() ) {
                d                   ( e              );
                //}
            }

            // Get the excluded identifiers in this block scoped container..

            for ( let h                     in b        .R                   ) {
                let j                  = b        .R                  [ h                     ];

                // For function scoped identifiers we must exclude the identifier from the current container parent.
                // Note that for ES5, which doesn't have block scoped variables, we must also exclude the identifier.
                if ( ( !j                 .Q                     ) || ( f      === a .ScriptTarget.ES5 ) ) {
                    if ( !Utils.k          ( g       , j                 .K    () ) ) {
                        g       [ j                 .K    () ] = j                 ;
                    }
                }
            }
        }

        // Start the search for excluded identifiers from the container's parent - the parent function scope container.
        d                   ( b        .W        () );
        
        return g       ;
    }

    private vb                       ( a             : C             , b        : D         ): void {
        if ( a             .J      () === 'getHeritageExportProperties' ) {
            var d        = 1;
        }
        // Exclude all shortened names that have already been used in child containers that this identifer is contained in.
        let c                    = a             .L            ();

        // For each container that the identifier is contained in..
        for ( let e            in c                    ) {
            let f                   = c                   [ e            ];

            let g                 = this.ub                             ( f                   );
                
            // We can't use any names that have already been used in this referenced container
            for( let h                     in g                 ) {
                let i                  = g                [ h                     ];

                if ( i                 .m             ) {
                    b        .N            [ i                 .m             ] = true;
                }
            }
        }
    }
    
    //private isNextContainer( node: ts.Node ): boolean {
    //    let containerFlags: Ast.ContainerFlags = Ast.getContainerFlags( node );

    //    if ( containerFlags & ( Ast.ContainerFlags.IsContainer | Ast.ContainerFlags.IsBlockScopedContainer ) ) {
    //        let nextContainer = new Container( node )

    //        // Check if the container symbol is classifiable. If so save it for inheritance processing.
    //        let containerSymbol: ts.Symbol = (<any>node).symbol;

    //        if ( containerSymbol && ( containerSymbol.flags & ts.SymbolFlags.Class ) ) {
    //            let containerSymbolUId: string = Ast.getIdentifierUID( containerSymbol );

    //            // Save the class symbol into the current container ( its parent )
    //            if ( !Utils.hasProperty( this.currentContainer().classifiableSymbols, containerSymbolUId ) ) {
    //                this.currentContainer().classifiableSymbols[ containerSymbolUId ] = containerSymbol;
    //            }

    //            // Save to the all classifiable containers table. See NOTE Inheritance below.
    //            if ( !Utils.hasProperty( this.classifiableContainers, containerSymbol.name ) ) {
    //                this.classifiableContainers[ containerSymbol.name ] = nextContainer;
    //            }

    //            // Check for inheritance. We need to do this now because the checker cannot be used once names are shortened.
    //            let extendsClause = Ast.getExtendsClause( node )
            
    //            if ( extendsClause ) {
    //                let baseClassSymbol = this.checker.getSymbolAtLocation( <ts.Identifier>extendsClause.types[0].expression );
                     
    //                // NOTE Inheritance:
    //                // If this child class is declared before the parent base class then the base class symbol will have symbolFlags.Merged.
    //                // When the base class is declared it will have a different symbol id from the symbol id determined here.
    //                // We should be able to use the symbol name for lookups in the classifiable containers table.
    //                // let baseClassAlias = this.checker.getAliasedSymbol(baseClassSymbol);

    //                nextContainer.setBaseClass( baseClassSymbol );
    //            }
    //        }

    //        // Before changing the current container we must first add the new container to the children of the current container.
    //        let currentContainer = this.currentContainer();
                        
    //        // If we don't have a container yet then it is the source file container ( the first ).
    //        if ( !currentContainer ) {
    //            this.sourceFileContainer = nextContainer;
    //        }
    //        else {
    //            // Add new container context to the exising current container
    //            currentContainer.addChildContainer( nextContainer );
    //        }

    //        this.containerStack.push( nextContainer );

    //        Logger.info( "Next container id: ", nextContainer.getId(), nextContainer.getParent().getId() );

    //        return true;
    //    }

    //    return false;
    //}

    

    private wb                    () {
        let a                  = new r                 ();

        a                 .d         ( "Minify time", this.gb            );
        a                 .c          ( "Total identifiers", this.eb              );
        a                 .c          ( "Identifiers shortened", this.fb                       );
    }

    private xb      ( a    : string ): string {
        return h     ( a     );
    }
}
                                                                                         function e                   ( b      : a .Program ): a .TransformerFactory<a .SourceFile> {
    return ( d      : a .TransformationContext ) => c                ( b      , d       );
}

function c                ( b      : a .Program, d      : a .TransformationContext ): a .Transformer<a .SourceFile> {

    const e               = d      .getCompilerOptions();
    let f                : a .SourceFile;
    let g            = null;
    let h        = new G             ( b      , e              , g            );
    //bundleSourceFile = minifier.transform( bundleSourceFile );

    return i                  ;

    /**
     * Minify the provided SourceFile.
     *
     * @param node A SourceFile node.
     */
    function i                  ( b   : a .SourceFile ) {
        if ( b   .isDeclarationFile ) {
            return b   ;
        }

        f                 = b   ;

        h       .jb                ( b    );

        const c       = a .visitEachChild( b   , e      , d       );

        //addEmitHelpers( visited, context.readEmitHelpers() );

        return c      ;
    }

    function e      ( b   : a .Node ): a .VisitResult<a .Node> {
        switch ( b   .kind ) {
            case a .SyntaxKind.Identifier:
                return c              ( <a .Identifier>b    );
        }

        return b   ;
    }

    function c              ( b   : a .Identifier ) {
        return b   ;
    }
}
                                                                                                            class H                   {
    
    public static b                ( d          : ReadonlyArray<a .Diagnostic> ) {
        if ( !d           ) {
            return;
        }

        for ( var i = 0; i < d          .length; i++ ) {
            this.d               ( d          [i] );
        }
    }

    public static d               ( b         : a .Diagnostic ) {
        if ( !b          ) {
            return;
        }

        var c      = "";

        if ( b         .file ) {
            var f   = a .getLineAndCharacterOfPosition( b         .file, b         .start );

            c      += chalk.gray( `${ b         .file.fileName }(${ f  .line + 1 },${ f  .character + 1 }): ` );
        }

        var e       ;

        switch ( b         .category ) {
            case a .DiagnosticCategory.Error:
                e        = chalk.red( a .DiagnosticCategory[b         .category].toLowerCase() );
                break;
            case a .DiagnosticCategory.Warning:
                e        = chalk.yellow( a .DiagnosticCategory[b         .category].toLowerCase() );
                break;
            default:
                e        = chalk.green( a .DiagnosticCategory[b         .category].toLowerCase() );
        }

        c      += `${e       } TS${chalk.white( b         .code + '' )}: ${chalk.grey( a .flattenDiagnosticMessageText( b         .messageText, "\n" ) )}`;

        n     .l  ( c      );
    }
} 
                                                                                                                                                                                                                                                                                                                                                                                     class I                   {

    public j   : y                ;
    private k      : a .Program;
    public o     : ProjectConfig;

    // FIXME: Not referenced
    private t    : a .MapLike<string>;

    constructor( d   : y                , e     : ProjectConfig, m      ?: a .Program ) {
        this.j    = d   ;
        this.C         ( m       );
        this.o      = e     ;
    }

    public v          () {
        this.o     .compilerOptions.watch || false;
    }

    public x         () {
        return this.k      ;
    }

    public C         ( b      : a .Program ) {

        if ( this.k       ) {

            let d              = b       ? b      .getSourceFiles() : undefined;

            Utils.c      ( this.k      .getSourceFiles(), b          => {

                // Remove fileWatcher from the outgoing program source files if they are not in the 
                // new program source file set

                if ( !( d              && Utils.g       ( d              as a .SourceFile[], b          ) ) ) {

                    let c                : TsCore.WatchedSourceFile = b         ;

                    if ( c                .fileWatcher ) {
                        c                .fileWatcher.unwatch( c                .fileName );
                    }
                }
            });
        }

        // Update the host with the new program
        this.j   .z                  ( b       );

        this.k       = b      ;
    }
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           class J             {

    private q     : Bundle;

    private t           : y                ;
    private v      : a .Program;

    private z              = 0;
    private D                  = 0;
    private E        = 0;
    private F         = 0;

    private G             : string = "";
    private L               : string = "";

    private M   : Map<string,a .Node[]>;

    private N                  : a .MapLike<string> = {};
    private O                  : a .MapLike<a .MapLike<string>> = {};
    private P                : a .MapLike<string> = {};

    constructor( b           : y                , c      : a .Program ) {
        this.t            = b           
        this.v       = c      ;
    }

    public Q    ( y     : Bundle ): A            {
        this.q      = y     ;
        this.F         = new Date().getTime();

        let E                 = new B                ( this.t           , this.v       );

        // Construct bundle output file name
        let M             = d   .dirname( y     .name );

        if ( y     .config.outDir ) {
            M             = d   .join( M            , y     .config.outDir );
        }

        let R              = d   .join( M            , d   .basename( y     .name ) );
        R              = TsCore.w               ( R              );

        this.G              = "";
        this.L                = "";

        this.N                   = {};
        this.O                   = {};
        this.P                 = {};

        // Look for tsx source files in bundle name or bundle dependencies.
        // Output tsx for bundle extension if typescript react files found.
        var S           = false;

        let T              : a .MapLike<a .Node[]> = {};

        for ( var X        in y     .fileNames ) {
            let Y        = y     .fileNames[X       ];
            n     .p   ( ">>> Processing bundle file:", Y        );

            let $                    = this.t           .getCanonicalFileName( TsCore.w               ( Y        ) );
            n     .p   ( "bundleSourceFileName:", $                    );

            let _                = this.v      .getSourceFile( $                    );

            if ( !_                ) {
                let cb         = TsCore.m               ( { code: 6060, category: a .DiagnosticCategory.Error, key: "Bundle_source_file_0_not_found_6060", message: "Bundle source file '{0}' not found." }, $                    );

                return new A           ( a .ExitStatus.DiagnosticsPresent_OutputsSkipped, [cb        ] );
            }

            // Check for TSX
            if ( _               .languageVariant == a .LanguageVariant.JSX ) {
                S           = true;
            }
           
            let ab        = new Date().getTime();

            // Get bundle source file module dependencies...
            let bb                 = E                .i                        ( _                );

            this.z              += new Date().getTime() - ab       ;

            // Merge current bundle file dependencies into all dependencies
            for ( var db       in bb                 ) {
                if ( !Utils.k          ( T              , db       ) ) {
                    T              [ db       ] = bb                [ db       ];
                }
            }

            ab        = new Date().getTime();
            
            n     .p   ( "Traversing module dependencies for bundle: ", _               .fileName );
            
            for ( var eb             in bb                 ) {
                n     .p   ( "Walking dependency nodes for module: ", eb             );
                var fb                    = bb                [ eb             ];

                fb                   .forEach( b                    => {
                    // Obtain the source file from the dependency node ( usually an import statement )

                    // REVIEW: Combine these.
                    var c                = this.bb               ( b                    );
                    var d              = TsCore.j                      ( c                );

                    if ( d              && !d             .isDeclarationFile ) {
                        let e                  = this.t           .getCanonicalFileName( d             .fileName );
                        let f               = bb                [ e                  ];

                        if ( f               ) {
                            this.R                        ( b                   , f               );
                        }

                        if ( !Utils.k          ( this.N                  , e                  ) ) {
                            this.Z            ( d              );
                        }
                    }
                    else {
                        if ( b                   .kind === a .SyntaxKind.ImportEqualsDeclaration ) {
                            // For ImportEqualsDeclarations we emit the import declaration
                            // if it hasn't already been added to the bundle.

                            // Get the import and module names
                            let g          = ( <a .ImportEqualsDeclaration>b                    ).name.text;
                            var h          = this.T                  ( <a .ImportEqualsDeclaration>b                    );

                            if ( this.U              ( h         , g          ) ) {
                                this.Y                          ( b                   .getText() );
                            }
                        }
                        else {
                            // ImportDeclaration kind..
                            if ( b                   .kind === a .SyntaxKind.ImportDeclaration ) {
                                this.V                     ( <a .ImportDeclaration>b                    );
                            }
                        }
                    }
                });
            }

            // Finally, add bundle source file
            this.Z            ( _                );

            this.D                  += new Date().getTime() - ab       ;
        }

        // The text for our bundle is the concatenation of import statements and source code
        let U          = this.L               ;

        if ( y     .config.package.d             () === BundlePackageType.Library ) {
            // Wrap the bundle in an exported namespace with the bundle name
            U          += "export namespace " + y     .config.package.e                  () + " {\r\n";
            U          += this.G             ;
            U          += " \r\n}";
        }
        else {
            U          += this.G             ;
        }

        var V               = S           ? ".tsx" : ".ts";
        var W          = { path: R              + V              , extension: V              , text: U          };

        this.F         = new Date().getTime() - this.F        ;

        if ( (<TsCompilerOptions>this.v      .getCompilerOptions()).diagnostics ) {
            this.db              ();
        }

        return new A           ( a .ExitStatus.Success, undefined, W          );
    }

    private R                        ( b                   : a .Node, c              : a .Node[] ) {
        for ( var d              of c               ) {
            var e                = this.bb               ( d              );
            var f              = TsCore.j                      ( e                );

            if ( f              && !f             .isDeclarationFile ) {
                let g                  = this.t           .getCanonicalFileName( f             .fileName );

                if ( d             .kind === a .SyntaxKind.ImportDeclaration ) {
                    var h                  = this.cb                        ( <a .ImportDeclaration>d              );

                    if ( h                  && this.S                 ( b                   , h                  ) ) {
                        // Add the dependency file to the bundle now if it is required for inheritance. 
                        if ( !Utils.k          ( this.N                  , g                  ) ) {
                            this.Z            ( f              );
                        }
                    }
                }
            }
        }
    }

    private S                 ( b             : a .Node, c            : string[] ): boolean {
        var d                = this.bb               ( b              );
        var e              = ( a .TypeFlags.Any | a .TypeFlags.String | a .TypeFlags.Number | a .TypeFlags.Boolean | a .TypeFlags.BooleanLiteral | a .TypeFlags.ESSymbol | a .TypeFlags.Void | a .TypeFlags.Undefined | a .TypeFlags.Null | a .TypeFlags.Never | a .TypeFlags.NonPrimitive );
        const f       = this.v      .getTypeChecker();
        var g       = f      .getExportsOfModule( d                );
        
        for ( var h              of g       ) {
            // We need to check for intrinsic types as Typescript checker.getBaseTypes() chokes on intrinsics            
            var i          = f      .getDeclaredTypeOfSymbol( h              );
            if ( i         .flags & e              ) {
                continue;
            }

            var j         = f      .getBaseTypes( <a .InterfaceType>i          );

            for ( var k        of j         ) {
                var l            = k       .symbol.getName();

                if ( c            .indexOf( l            ) >= 0 ) {
                    n     .p   ( "Base class inheritance found", l            );
                    return true;
                }
            }
        }

        return false;
    }

    private T                  ( b   : a .ImportEqualsDeclaration ): string {

        if ( b   .moduleReference.kind === a .SyntaxKind.ExternalModuleReference ) {
            let d               = ( <a .ExternalModuleReference>b   .moduleReference );
            return ( <a .LiteralExpression>d              .expression ).text;
        }
        else {
            // TJT: This code should never be hit as we currently do not process dependencies of this kind. 
            return ( <a .EntityName>b   .moduleReference ).getText();
        }
    }

    private U              ( a         : string, b         : string ): boolean {

        if ( !Utils.k          ( this.O                  , a          ) ) {
            this.O                  [ a          ] = {};
        }

        var c             = this.O                  [ a          ];

        if ( !Utils.k          ( c            , b          ) ) {
            c            [ b          ] = b         ;

            return true;
        }

        return false;
    }

    private V                     ( b   : a .ImportDeclaration ) {

        if ( !b   .importClause ) {
            return;
        }

        let d          = ( <a .LiteralExpression>b   .moduleSpecifier ).text;

        var e             = "import ";
        var f                 = false;
        var g                = false;

        if ( b   .importClause ) {
            if ( b   .importClause.name && this.U              ( d         , b   .importClause.name.text ) ) {
                e             += b   .importClause.name.text;
                f                 = true;
            }
        }

        if ( b   .importClause.namedBindings ) {
            if ( b   .importClause.namedBindings.kind === a .SyntaxKind.NamespaceImport ) {
                if ( this.U              ( d         , ( <a .NamespaceImport>b   .importClause.namedBindings ).name.text ) ) {
                    if ( f                 ) {
                        e             += ", ";
                    }

                    e             += "* as ";
                    e             += ( <a .NamespaceImport>b   .importClause.namedBindings ).name.text;

                    g                = true;
                }
            }
            else {
                if ( f                 ) {
                    e             += ", ";
                }

                e             += "{ ";

                Utils.c      (( <a .NamedImports>b   .importClause.namedBindings ).elements, a       => {
                    if ( this.U              ( d         , a      .name.text ) ) {
                        if ( !g                ) {
                            g                = true;
                        }
                        else {
                            e             += ", ";
                        }

                        let b     = a      .propertyName;

                        if ( b     ) {
                            e             += b    .text + " as " + a      .name.text;
                        }
                        else {
                            e             += a      .name.text;
                        }
                    }
                });

                e             += " }";
            }
        }

        e             += " from ";
        e             += b   .moduleSpecifier.getText();
        e             += ";";

        if ( f                 || g                ) {
            this.Y                          ( e             );
        }
    }

    private W                   ( c   : a .SourceFile ): string {
        n     .p   ( "Processing import statements and export declarations in file: ", c   .fileName );
        let f        = c   .text;

        a .forEachChild( c   , c    => {
            if ( c   .kind === a .SyntaxKind.ImportDeclaration || c   .kind === a .SyntaxKind.ImportEqualsDeclaration || c   .kind === a .SyntaxKind.ExportDeclaration ) {
                n     .p   ( "processImportStatements() found import" );
                let g                    = TsCore.k                    ( c    );

                if ( g                    && g                   .kind === a .SyntaxKind.StringLiteral ) {

                    let h            = this.v      .getTypeChecker().getSymbolAtLocation( g                    );

                    if ( ( h            ) && ( this._                 ( h            ) || this.ab              ) ) {
                        n     .p   ( "processImportStatements() removing code module symbol." );
                        f        = this.X       ( c   .pos, c   .end, f        );
                    }
                }
            }
            else {
                // TJT - Review this...
                if ( this.q     .config.package.d             () === BundlePackageType.Component ) {
                    if ( c   .kind === a .SyntaxKind.ModuleDeclaration ) {
                        let i      = <a .ModuleDeclaration>c   ;

                        if ( i     .name.getText() !== this.q     .config.package.e                  () ) {
                            if ( Ast.b                      ( i      ) & a .ModifierFlags.Export ) {
                                n     .p   ( "Component namespace not package namespace. Removing export modifier." );
                                let j            = i     .modifiers[0];
                                f        = this.X       ( j           .pos, j           .end, f        );
                            }
                        }
                    }
                    else {
                        if ( Ast.b                      ( c    ) & a .ModifierFlags.Export ) {
                            let l              = c   .modifiers[0];

                            f        = this.X       ( l             .pos, l             .end, f        );
                        }
                    }
                }
            }
        });

        return f       ;
    }

    private X       ( a  : number, b  : number, c   : string ): string {
        let d      = b   - a  ;
        let e          = "";

        for ( var i = 0; i < d     ; i++ ) {
            e          += " ";
        }

        var f      = c   .substring( 0, a   );
        var g      = c   .substring( b   );

        return f      + e          + g     ;
    }

    private Y                          ( a              : string ) {
        n     .p   ( "Entering emitModuleImportDeclaration()" );

        this.L                += a               + "\n";
    }

    private Z            ( b   : a .SourceFile ) {
        n     .p   ( "Entering addSourceFile() with: ", b   .fileName );

        if ( this.$               ( b    ) ) {
            // Before adding the source text, we must white out non-external import statements and
            // white out export modifiers where applicable
            let c        = this.W                   ( b    );

            this.G              += c        + "\n";

            let d              = this.t           .getCanonicalFileName( b   .fileName );
            this.N                  [ d              ] = d             ;
        }
        else {
            // Add typescript definition files to the build source files context
            if ( !Utils.k          ( this.P                , b   .fileName ) ) {
                n     .p   ( "Adding definition file to bundle source context: ", b   .fileName );
                this.P                [ b   .fileName ] = b   .text;
            }
        }
    }

    private $               ( b   : a .SourceFile ): boolean {
        return ( b   .kind === a .SyntaxKind.SourceFile && !b   .isDeclarationFile );
    }

    private _                 ( b           : a .Symbol ): boolean {
        let c           = b           .getDeclarations()[0];

        return ( ( c          .kind === a .SyntaxKind.SourceFile ) && !( (<a .SourceFile>c          ).isDeclarationFile ) );
    }

    private ab             ( b     : a .Symbol ): boolean {
        const c            = b     .getDeclarations();

        if ( c            && c           .length > 0 ) {
            const d           = b     .getDeclarations()[0];

            if ( d          .kind === a .SyntaxKind.ModuleDeclaration ) {
                if ( d          .modifiers ) {
                    for ( const e        of d          .modifiers ) {
                        if ( e       .kind === a .SyntaxKind.DeclareKeyword ) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    // TJT: Review duplicate code. Move to TsCore pass program as arg.
    private bb               ( b   : a .Node ): a .Symbol {
        let c              = TsCore.k                    ( b    );

        if (c              && c             .kind === a .SyntaxKind.StringLiteral) {
            return this.v      .getTypeChecker().getSymbolAtLocation(c             );
        }

        // TJT: Throw?

        return undefined;
    }

    private cb                        ( b   : a .ImportDeclaration ): string[] {
        const c           : string[] = [];

        if ( ( b   .kind === a .SyntaxKind.ImportDeclaration ) && b   .importClause.namedBindings ) {
            const d             = b   .importClause.namedBindings;

            switch ( d            .kind ) {
                case a .SyntaxKind.NamespaceImport:
                    break;

                case a .SyntaxKind.NamedImports:
                    for ( const e             of ( <a .NamedImports>d             ).elements ) {
                        c           .push( e            .getText() );
                    }

                    break;
            }
        }

        return c           ;
    }

    private db              () {
        let a                  = new r                 ();

        a                 .d         ( "Deps gen time", this.z              );
        a                 .d         ( "Deps walk time", this.D                  );
        a                 .d         ( "Source gen time", this.F         );
    }
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      class K              {

    private m           : y                ;
    private t      : a .Program;
    private v           : q            ;
    private z              : TsCompilerOptions;

    private D       : number = 0;
    private E          : number = 0;
    private F          : number = 0;

    private L                : a .MapLike<string> = {};

    constructor( b           : y                , c      : a .Program, d           : q             ) {
        this.m            = b           
        this.t       = c      ;
        this.v            = d           ;
        this.z               = this.t      .getCompilerOptions();
    }

    public M      ( q         : BundleFile, y           : BundleConfig ): o              {
        n     .l  ( "Compiling bundle..." );

        this.E           = this.F           = new Date().getTime();

        // Bundle data
        let O             : string;
        let P             : string;
        let R               : a .SourceFile;

        // The list of bundle files to pass to program 
        let S          : string[] = [];

        // TJT: Bug - How to resolve duplicate identifier error

        Utils.c      ( this.t      .getSourceFiles(), a    => {
            S          .push( a   .fileName );
        });

        let T         : a .MapLike<string> = {};
        let U                   : ( b       : string, c              : a .ScriptTarget, d      ?: ( a      : string ) => void ) => a .SourceFile;

        let V            = y           .minify || false;

        if ( V            ) {
            // Create the minified bundle fileName
            let jb        = d   .dirname( q         .path );
            let kb         = d   .basename( q         .path, q         .extension );

            O              = TsCore.w               ( d   .join( jb       , kb         + ".min.ts" ) );
        }
        else {
            O              = q         .path;
        }

        P              = q         .text;
        this.L                [ O              ] = P             ;
        R                = a .createSourceFile( O             , q         .text, this.z              .target );
        S          .push( O              );        

        // Reuse the project program source files
        Utils.c      ( this.t      .getSourceFiles(), a    => {
            this.L                [ a   .fileName ] = a   .text;
        });

        function j        ( b       : string, f   : string, g                 : boolean, i      ?: ( a      : string ) => void ) {
            T         [ b        ] = f   ;
        }

        function r            ( b       : string, f              : a .ScriptTarget, g      ?: ( a      : string ) => void ): a .SourceFile {
            if ( b        === O              ) {
                return R               ;
            }

            // Use base class to get the all source files other than the bundle
            let i         : TsCore.WatchedSourceFile = U                   ( b       , f              , g       );

            return i         ;
        }

        // Override the compileHost getSourceFile() function to get the bundle source file
        U                    = this.m           .getSourceFile;
        this.m           .getSourceFile = r            ;
        this.m           .writeFile = j        ;

        // Allow bundle config to extent the project compilerOptions for declaration and source map emitted output
        let W               = this.z              ;
        
        W              .declaration = y           .declaration || this.z              .declaration;
        W              .sourceMap = y           .sourceMap || this.z              .sourceMap;
        W              .noEmit = false; // Always emit bundle output

        if ( V            ) {
            // TJT: Temporary workaround. If declaration is true when minifying an emit error occurs.
            W              .declaration = false;
            W              .removeComments = true;
        }

        // Pass the current project build program to reuse program structure
        var X              = a .createProgram( S          , W              , this.m            );

        // Check for preEmit diagnostics
        var Y                  = a .getPreEmitDiagnostics( X              );

        this.F           = new Date().getTime() - this.F          ;

        // Return if noEmitOnError flag is set, and we have errors
        if ( this.z              .noEmitOnError && Y                 .length > 0 ) {
            return new o             ( a .ExitStatus.DiagnosticsPresent_OutputsSkipped, Y                  );
        }

        if ( V            ) {
            n     .l  ( "Minifying bundle..." );
            let lb       = new G             ( X             , W              , y            );
            R                = lb      .hb       ( R                );
        }

        this.D        = new Date().getTime();
        
        let Z         = e                   ( X              );
        const $      = a .transform( R               , [Z        ] );
        var _          = X             .emit( R                );

        this.D        = new Date().getTime() - this.D       ;

        // Always stream the bundle source file ts - even if emit errors.
        n     .p   ( "Streaming vinyl bundle source: ", O              );
        var ab          = new VinylFile( {
            path: O             ,
            contents: Buffer.from( h     ( R               .text ) )
        });

        this.v           .B   ( ab          );
        
        // Concat any emit errors
        let bb             = Y                 .concat( _         .diagnostics as a .Diagnostic[] );
        
        // If the emitter didn't emit anything, then pass that value along.
        if ( _         .emitSkipped ) {
            return new o             ( a .ExitStatus.DiagnosticsPresent_OutputsSkipped, bb             );
        }

        // The emitter emitted something, inform the caller if that happened in the presence of diagnostics.
        if ( this.z              .noEmitOnError && bb            .length > 0 ) {
            return new o             ( a .ExitStatus.DiagnosticsPresent_OutputsGenerated, bb             );
        }

        // Emit the output files even if errors ( noEmitOnError is false ).

        // Stream the emitted files...
        let cb        = d   .dirname( q         .path );
        let db         = d   .basename( q         .path, q         .extension );
        let eb              = V            ? ".min" : "";

        let fb           = TsCore.w               ( d   .join( cb       , db         + eb              + ".js" ) );

        // js should have been generated, but just in case!
        if ( Utils.k          ( T         , fb           ) ) {
            let mb         = T         [ fb           ];
            if ( V            ) {
                // Whitespace removal cannot be performed in the AST minification transform, so we do it here for now
                let ob       = new G             ( X             , W              , y            );
                // FIXME:
                //jsContents = minifier.removeWhitespace( jsContents );
                
            }
            n     .p   ( "Streaming vinyl js: ", db         );
            var nb                = new VinylFile( {
                path: fb          ,
                contents: Buffer.from( mb         )
            });

            this.v           .B   ( nb                );
        }

        let gb            = TsCore.w               ( d   .join( cb       , db         + eb              + ".d.ts" ) );
        
        // d.ts is generated, if compiler option declaration is true
        if ( Utils.k          ( T         , gb            ) ) {
            n     .p   ( "Streaming vinyl d.ts: ", gb            );
            var pb                 = new VinylFile( {
                path: gb           ,
                contents: Buffer.from( T         [ gb            ] )
            });

            this.v           .B   ( pb                 );
        }

        let ib            = TsCore.w               ( d   .join( cb       , db         + eb              + ".js.map" ) );
        
        // js.map is generated, if compiler option sourceMap is true
        if ( Utils.k          ( T         , ib            ) ) {
            n     .p   ( "Streaming vinyl js.map: ", ib            );
            var qb                 = new VinylFile( {
                path: ib           ,
                contents: Buffer.from( T         [ib           ] )
            });

            this.v           .B   ( qb                 );
        }

        this.E           = new Date().getTime() - this.E          ;

        if ( this.z              .diagnostics )
            this.N               ();

        if ( bb            .length > 0 ) {
            return new o             ( a .ExitStatus.DiagnosticsPresent_OutputsGenerated, bb             );
        }
        else {
            return new o             ( a .ExitStatus.Success );
        }
    }

    private N               () {
        let a                  = new r                 ();

        a                 .d         ( "Pre-emit time", this.F           );
        a                 .d         ( "Emit time", this.D        );
        a                 .d         ( "Compile time", this.E           );
    }
} 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    class L              {

    private v             : string;
    private D       : any;

    private E           : q            ;

    private F            : string;
    private G             : string;

    private N             : number = 0;
    private O               : number = 0;
    private P                : number = 0;
    private R              : number = 0;

    private S           : I                  ;

    private T                : c       .FSWatcher;

    private U           : NodeJS.Timer;

    constructor( a             : string, b       ?: any  ) {
        this.v              = a             ;
        this.D        = b       ;
    }

    public V    ( z           : q             ): a .ExitStatus {
        let B      = this.$                 ();

        if ( !B     .success ) {
            H                  .b                ( B     .errors );

            return a .ExitStatus.DiagnosticsPresent_OutputsSkipped;
        }

        this.S            = this.W                 ( B      );

        n     .l  ( "Building Project with: " + chalk.magenta( `${this.G             }` ) );
        n     .l  ( "TypeScript compiler version: ", a .version );

        this.E            = z           ;

        // Perform the build..
        var T           = this.Z          ();

        this.ib               ( T           );

        if ( B     .compilerOptions.watch ) {
            n     .l  ( "Watching for project changes..." );
        }
        else {
            this.Y                   ();
        }

        return T          ;
    }

    private W                 ( k     : ProjectConfig ) : I                   {

        if ( k     .compilerOptions.watch ) {
            if ( !this.X           () ) {
                k     .compilerOptions.watch = false;
            }
        }

        let t            = new y                ( k     .compilerOptions, this.bb                  );

        return new I                  ( t           , k      );
    }

    private X           () : boolean {
        if ( !a .sys.watchFile ) {
            let b          = TsCore.m               ( { code: 5001, category: a .DiagnosticCategory.Warning, key: "The_current_node_host_does_not_support_the_0_option_5001", message: "The current node host does not support the '{0}' option." }, "-watch" );
            H                  .d               ( b          );

            return false;
        }

        // Add a watcher to the project config file if we haven't already done so.
        if ( !this.T                 ) {
            this.T                 = c       .watch( this.G              );
            this.T                .on( "change", ( t   : string, L    : any ) => this.ab                 ( t   , L     ) );
        }

        return true;
    }

    private Y                   (): void {
        // End the build process by sending EOF to the compilation output stream.
        this.E           .B   ( null );
    }

    private Z          (): a .ExitStatus {
        this.N              = this.P                 = new Date().getTime();

        if ( !this.S            ) {
            let B      = this.$                 ();

            if ( !B     .success ) {
                H                  .b                ( B     .errors );

                return a .ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }

            this.S            = this.W                 ( B      );
        }

        let d             : a .Diagnostic[] = [];

        let e         = this.S           .o     .fileNames;
        let k       = this.S           .o     .bundles;
        let m               = this.S           .o     .compilerOptions;

        // Create a new program to handle the incremental build. Pass the current build context program ( if it exists )
        // to reuse the current program structure.
        let p       = a .createProgram( e        , m              , this.S           .j   , this.S           .x         () );

        this.P                 = new Date().getTime() - this.P                ;

        // Save the new program to the build context
        this.S           .C         ( p       );

        // Compile the project...
        let q        = new w       ( this.S           .j   , p      , this.E            );

        this.O                = new Date().getTime();

        var t             = q       .I      ();

        this.O                = new Date().getTime() - this.O               ;

        if ( !t            .h        () ) {
            H                  .b                ( t            .f        () );

            return t            .g        ();
        }

        if ( m              .listFiles ) {
            Utils.c      ( this.S           .x         ().getSourceFiles(), a    => {
                n     .l  ( a   .fileName );
            });
        }

        this.R               = new Date().getTime();

        // Build bundles..
        var v             = new J            ( this.S           .j   , this.S           .x         () );
        var y              = new K             ( this.S           .j   , this.S           .x         (), this.E            );
        var z           : A           ;

        for ( var i = 0, D   = k      .length; i < D  ; i++ ) {
            n     .l  ( "Building bundle: ", chalk.cyan( k      [i].name ) );

            z            = v            .Q    ( k      [i] );

            if ( !z           .u        () ) {
                H                  .b                ( z           .s        () );

                return a .ExitStatus.DiagnosticsPresent_OutputsSkipped;
            }

            t             = y             .M      ( z           .r              (), k      [ i ].config );

            if ( !t            .h        () ) {
                H                  .b                ( t            .f        () );

                return t            .g        ();
            }
        }

        this.R               = new Date().getTime() - this.R              ;
        this.N              = new Date().getTime() - this.N             ;

        if ( m              .diagnostics ) {
            this.jb              ();
        }

        if ( d             .length > 0 ) {
            return a .ExitStatus.DiagnosticsPresent_OutputsGenerated;
        }

        return a .ExitStatus.Success;
    }

    private $                 (): ProjectConfig {
        try {
            var q                 = b .lstatSync( this.v              ).o          ();
        }
        catch ( e ) {
            let r          = TsCore.m               ( { code: 6064, category: a .DiagnosticCategory.Error, key: "Cannot_read_project_path_0_6064", message: "Cannot read project path '{0}'." }, this.v              );
            return { success: false, errors: [r         ] };
        }

        if ( q                 ) {
            this.F             = this.v             ;
            this.G              = d   .join( this.v             , "tsconfig.json" );
        }
        else {
            this.F             = d   .dirname( this.v              );
            this.G              = this.v             ;
        }

        n     .p   ( "Reading config file:", this.G              );
        let f                = a .readConfigFile( this.G             , this.eb       );

        if ( f               .error ) {
            return { success: false, errors: [f               .error] };
        }

        let g            = f               .config;

        // Parse standard project configuration objects: compilerOptions, files.
        n     .p   ( "Parsing config file..." );
        var h                 = a .parseJsonConfigFileContent( g           , a .sys, this.F             );

        if ( h                .errors.length > 0 ) {
            return { success: false, errors: h                .errors };
        }

        // The returned "Files" list may contain file glob patterns. 
        h                .fileNames = this.gb             ( h                .fileNames, this.F             );

        // The glob file patterns in "Files" is an enhancement to the standard Typescript project file (tsconfig.json) spec.
        // To convert the project file to use only a standard filename list, specify the setting: "convertFiles" : "true"
        if ( this.D       .convertFiles === true ) {
            this.hb                     ( h                .fileNames, this.F             );
        }

        // Parse "bundle" project configuration objects: compilerOptions, files.
        var i            = new u           ();
        var j                  = i           .c              ( g           , this.F             );

        if ( j                 .errors.length > 0 ) {
            return { success: false, errors: j                 .errors };
        }

        // The returned bundles "Files" list may contain file glob patterns. 
        j                 .bundles.forEach( a      => {
            a     .fileNames = this.gb             ( a     .fileNames, this.F             );
        });

        // Parse the command line args to override project file compiler options
        let k                       = this.fb                        ( this.D       , this.F             );

        // Check for any errors due to command line parsing
        if ( k                      .errors.length > 0 ) {
            return { success: false, errors: k                      .errors };
        }

        let l               = Utils.y     ( k                      .options, h                .options );

        n     .p   ( "Compiler options: ", l               );

        return {
            success: true,
            compilerOptions: l              ,
            fileNames: h                .fileNames,
            bundles: j                 .bundles
        }
    }
    
    private ab                  = ( a   : string, b    : any ) => {
        // Throw away the build context and start a fresh rebuild
        this.S            = undefined;

        this.cb               ();
    }

    private bb                  = ( a         : TsCore.WatchedSourceFile, b   : string, c    : any ) => {
        a         .fileWatcher.unwatch( a         .fileName );
        a         .fileWatcher = undefined;

        this.cb               ();
    }

    private cb               () {
        if ( this.U            ) {
            clearTimeout( this.U            );
        }

        this.U            = setTimeout( this.db              , 250 );
    }

    private db               = () => {
        this.U            = undefined;

        let a           = this.Z          ();

        this.ib               ( a           );

        if ( this.S           .o     .compilerOptions.watch ) {
            n     .l  ( "Watching for project changes..." );
        }
    }

    private eb      ( b       : string ): string {
        return a .sys.readFile( b        );
    }

    private fb                        ( b           : any, c            : string ): a .ParsedCommandLine {
        // Parse the json settings from the TsProject src() API
        let d            = a .parseJsonConfigFileContent( b           , a .sys, c             );

        // Check for compiler options that are not relevent/supported.

        // Not supported: --project, --init
        // Ignored: --help, --version

        if ( d           .options.project ) {
            let e          = TsCore.m               ( { code: 5099, category: a .DiagnosticCategory.Error, key: "The_compiler_option_0_is_not_supported_in_this_context_5099", message: "The compiler option '{0}' is not supported in this context." }, "--project" );
            d           .errors.push( e          );
        }

        // FIXME: Perhaps no longer needed?

        //if ( parsedResult.options.init ) {
        //    let diagnostic = TsCore.createDiagnostic( { code: 5099, category: ts.DiagnosticCategory.Error, key: "The_compiler_option_0_is_not_supported_in_this_context_5099", message: "The compiler option '{0}' is not supported in this context." }, "--init" );
        //    parsedResult.errors.push( diagnostic );
        //}

        return d           ;
    }

    private gb             ( e    : string[], f            : string ): string[] {
        // The parameter files may contain a mix of glob patterns and filenames.
        // glob.expand() will only return a list of all expanded "found" files. 
        // For filenames without glob patterns, we add them to the list of files as we will want to know
        // if any filenames are not found during bundle processing.

        var g    = new z   ();
        var h           : string[] = [];

        Utils.c      ( e    , b    => {
            if ( !g   .a         ( b    ) ) {
                h           .push( d   .normalize( b    ) );
            }
        });
                            
        // Get the list of expanded glob files
        var i         = g   .b     ( e    , f             );
        var j                  : string[] = [];

        // Normalize file paths for matching
        Utils.c      ( i        , a    => {
            j                  .push( d   .normalize( a    ) );
        });

        // The overall file list is the union of both non-glob and glob files
        return _.union( j                  , h            );
    }

    private hb                     ( a        : string[], c            : string ) {
        let f              = "";

        try {
            f              = b .readFileSync( this.G             , 'utf8' );

            if ( f              !== undefined ) {
                let g                = JSON.parse( f              );
                let h                : string[] = [];

                a        .forEach( a        => {
                    h                .push ( d   .relative( c            , a        ).replace( /\\/g, "/" ) );
                });

                g               ["files"] = h                ;

                b .writeFileSync( this.G             , JSON.stringify( g               , undefined, 4 ) );
            }
        }
        catch( e ) {
            n     .l  ( chalk.yellow( "Converting project files failed." ) );
        }
    }

    private ib               ( b          : a .ExitStatus ) {
        switch ( b           ) {
            case a .ExitStatus.Success:
                n     .l  ( chalk.green( "Project build completed successfully." ) );
                break;
            case a .ExitStatus.DiagnosticsPresent_OutputsSkipped:
                n     .l  ( chalk.red( "Build completed with errors." ) );
                break;
            case a .ExitStatus.DiagnosticsPresent_OutputsGenerated:
                n     .l  ( chalk.red( "Build completed with errors. " + chalk.italic( "Outputs generated." ) ) );
                break;
        }
    }

    private jb              () {
        let b                  = new r                 ();

        b                 .a          ( "Total build times..." );
        b                 .d         ( "Pre-build time", this.P                 );
        b                 .d         ( "Compiling time", this.O                );
        b                 .d         ( "Bundling time", this.R               );
        b                 .d         ( "Build time", this.N              );
    }
}
                                                                                                                                                                                                        

export namespace TsProject {

    export function src( a             : string, b       ?: any ): h     .t        {
        if ( a              === undefined && typeof a              !== 'string' ) {
            throw new Error( "Provide a valid directory or file path to the Typescript project configuration json file." );
        }

        b        = b        || {};
        b       .logLevel = b       .logLevel || 0;

        n     .j       ( b       .logLevel );
        n     .k      ( "TsProject" );

        var c            = new q            ();

        var d       = new L             ( a             , b        );
        d      .V    ( c            );

        return c           ;
    }
}

// Nodejs module exports
module.exports = TsProject;

