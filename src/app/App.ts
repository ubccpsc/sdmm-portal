/**
 * Created by rtholmes on 2017-10-04.
 */

import {AuthHelper} from "./util/AuthHelper";
import {UI} from "./util/UI";
import Log from "./util/Log";
// import 'whatwg-fetch';
import {OnsButtonElement, OnsPageElement} from "onsenui";
import {Network} from "./util/Network";

declare var classportal: any;

export class App {

//     private studentController: StudentController = null;
//    private adminController: AdminController = null;

    private AUTH_STATUS = 'authorized';
    private UNAUTH_STATUS = 'unauthenticated';
    private backendDEV = 'https://localhost:3000/'; // NOTE: was 5000
    private backendPROD = 'https://sdmm.cs.ubc.ca:5000/';
    private frontendDEV = 'https://localhost:3000/';
    private frontendPROD = 'https://portal.cs.ubc.ca/';
    private authHelper: AuthHelper;
    public currentCourseId: number;
    public readonly backendURL = this.backendDEV;
    public readonly frontendURL = this.frontendDEV;

    constructor() {
        Log.trace('App::<init> - start');
        if (window.location.href.indexOf('://localhost') > 0) {
            this.backendURL = this.backendDEV;
            this.frontendURL = this.frontendDEV;
        } else {
            this.backendURL = this.backendPROD;
            this.frontendURL = this.frontendPROD;
        }

        // this.authHelper = new AuthHelper(this.backendURL);
        // this.authHelper.updateAuthStatus();

        Log.trace('App::<init> - backend: ' + this.backendURL);
    }

    public init() {
        Log.trace('App::init() - start');
        var that = this;
        document.addEventListener('init', function (event) {
            const page = event.target as OnsPageElement;


            const pageName = page.id;

            let courseId: string = null;

            if (typeof (<any>page).pushedOptions !== 'undefined' && typeof (<any>page).pushedOptions.courseId !== 'undefined') {
                courseId = (<any>page).pushedOptions.courseId;
                that.currentCourseId = (<any>page).pushedOptions.courseId;
            }

            console.log('App::init()::init - page: ' + pageName);


            if (pageName === 'adminTabsPage') {
                // initializing tabs page for the first time
                // that.adminController = new AdminController(that, courseId);
            }

            if (pageName === 'studentTabsPage') {
                // initializing tabs page for the first time
                // that.studentController = new StudentController(that, courseId);
            }

            /*
            // DO NOT DO THIS HERE; DO IT ON SHOW BELOW!

            // Each page calls its own initialization controller.
            if (that.studentController !== null) {
                if (typeof that.studentController[pageName] === 'function') {
                    that.studentController[pageName]();//(page);
                }
            }

            // Each page calls its own initialization controller.
            if (that.adminController !== null) {
                if (typeof that.adminController[pageName] === 'function') {
                    that.adminController[pageName]();//(page);
                }
            }
            */

            if (pageName === 'main') {
                if (1 + 1 > 0) {
                    return;
                }
                const AUTHORIZED_STATUS: string = 'authorized';

                Log.trace('App::main()::authCheck - starting main.html with auth check');

                that.toggleLoginButton();

                const URL = that.backendURL + 'currentUser';
                let OPTIONS_HTTP_GET: RequestInit = {credentials: 'include'};
                fetch(URL, OPTIONS_HTTP_GET).then((data: any) => {
                    if (data.status !== 200) {
                        Log.trace('App::main()::authCheck - WARNING: Response status: ' + data.status);
                        throw new Error('App::main()::authCheck - API ERROR: ' + data.status);
                    }
                    return data.json();
                }).then((data: any) => {
                    let user = data.response.user;
                    localStorage.setItem('userrole', user.userrole);
                    localStorage.setItem('username', user.username);
                    localStorage.setItem('authStatus', AUTHORIZED_STATUS);
                    localStorage.setItem('fname', user.fname);
                    that.toggleLoginButton();
                }).catch((err: any) => {
                    Log.error('App:main()::authCheck - ERROR: ' + err.message);
                });
            }

            if (pageName === 'loginPage') {

                const userrole = String(localStorage.userrole);
                // const username = String(localStorage.username);
                if (userrole === 'student') {
                    UI.pushPage('student.html', {courseId: courseId});
                } else if (userrole === 'admin' || userrole === 'superadmin') {
                    UI.pushPage('admin.html', {courseId: courseId});
                }

                (document.querySelector('#loginButton') as OnsButtonElement).onclick = function () {
                    Log.trace('App::init()::init - login pressed for: ' + courseId);
                    window.location.replace(that.backendURL + 'auth');
                };
            }
        });

        /**
         * Runs once a page is ready to be rendered.
         *
         * Useful for student view since we populate all tabs at once.
         */
        document.addEventListener('show', function (event) {
            const page = event.target as OnsPageElement;
            const pageName = page.id;
            let options = (<any>page).pushedOptions;
            if (typeof options === 'undefined') {
                options = {};
            }
            Log.trace('App::init()::show - page: ' + pageName);

            /*
            if (that.studentController !== null) {
                if (typeof that.studentController[pageName] === 'function') {
                    that.studentController[pageName](options);
                }
            }
            if (that.adminController !== null) {
                if (typeof that.adminController[pageName] === 'function') {
                    that.adminController[pageName](options);
                }
            }
            */
        });
    }

    public getAdminController(courseId: string) {
        Log.trace('App::getAdminController( ' + courseId + ' )');
        // return new AdminController(this, courseId);
    }

    public pushPage(page: string, opts?: any) {
        UI.pushPage(page, opts);
    }

    private async validateCredentials(): Promise<boolean> {
        let token = this.readCookie('token');
        if (token === null) {
            Log.info("App::validateCredentials() - token not set");
            localStorage.clear();
            return false;
        } else {
            var username = await this.getGithubCredentials(token);
            if (username !== null) {
                // valid username; get role from server
                Log.info("App::validateCredentials() - valid username");

                var credentials: any = await this.getServerCredentials(username, token);
                Log.info("App::validateCredentials() - validated with server; kind: " + credentials.kind);
                localStorage.setItem('user', credentials.user);
                localStorage.setItem('token', credentials.token);
                localStorage.setItem('kind', credentials.kind);
                return true;
            } else {
                Log.info("App::validateCredentials() - invalid username");
                // invalid username; logout
                // clear the cookie and refresh
                localStorage.clear();
                document.cookie = "token=empty;expires=" + new Date(0).toUTCString();
                location.href = location.href;
            }
        }
    }

    private getGithubCredentials(token: string): Promise<string | null> {
        Log.trace("App::getGithubCredentials - start");
        return fetch('https://api.github.com/user', {
            headers: {
                'Content-Type':  'application/json',
                'User-Agent':    'Portal',
                'Authorization': 'token ' + token
            }
        }).then(function (resp: any) {
            Log.trace("App::getGithubCredentials - resp then: " + resp);
            return resp.json();
        }).then(function (data: any) {
            Log.trace("App::getGithubCredentials - data then: " + data);
            return data.login;
        }).catch(function (err: any) {
            Log.error("App::getGithubCredentials - ERROR: " + err);
            return null;
        });
    };

    private getServerCredentials(username: string, token: string): Promise<{}> {
        Log.trace("App::getServerCredentials - start");
        return fetch('https://localhost:3000/getCredentials', {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent':   'Portal',
                'user':         username,
                'token':        token
            }
        }).then(function (resp: any) {
            Log.trace("App::getServerCredentials - resp: " + resp);
            return resp.json();
        }).then(function (data: any) {
            return data;
        }).catch(function (err: any) {
            Log.error("App::getServerCredentials - ERROR: " + err);
            return null;
        });
    };

    public handleMainPageClick(courseId: object) {
        Log.info("App::handleMainPageClick(..) - start");
        const AUTH_STATUS = 'authorized';
        const UNAUTH_STATUS = 'unauthorized';

        let userrole = typeof localStorage.userrole === 'undefined' ? null : localStorage.userrole;
        let authStatus = typeof localStorage.authStatus === 'undefined' ? 'unauthorized' : AUTH_STATUS;
        this.isLoggedIn(); // debugging
        // either go to Login page or redirect to student/admin management areas
        if (localStorage.authStatus !== AUTH_STATUS) {
            Log.info("App::handleMainPageClick(..) - not authorized");
            UI.pushPage('login.html', courseId);
        } else if (localStorage.authStatus === AUTH_STATUS && userrole === 'superadmin') {
            Log.info("App::handleMainPageClick(..) - super admin");
            UI.pushPage('superadmin.html', courseId);
        } else if (localStorage.authStatus === AUTH_STATUS && userrole === 'admin') {
            Log.info("App::handleMainPageClick(..) - admin");
            UI.pushPage('admin.html', courseId);
        } else {
            Log.info("App::handleMainPageClick(..) - student");
            UI.pushPage('student.html', courseId);
        }
    }

    /*
    * @Return Boolean - True if user is authenticated
    */
    public isLoggedIn() {
        let token = this.readCookie('token');

        const res = String(localStorage.authStatus) === this.AUTH_STATUS;
        Log.trace("App::isLoggedIn(); value: " + res + "; token: " + token);


        return res;
    }

    private readCookie(name: string) {
        let s: string[] = decodeURI(document.cookie).split(';');
        for (let i = 0; i < s.length; i++) {
            let row = s[i].split('=', 2);
            if (row.length === 2 && row[0] == name) {
                return row[1];
            }
        }
        return null;
    }

    public logout() {
        Log.trace("App::logout() - start");
        let url = this.backendURL + '/logout';
        let OPTIONS_HTTP_GET: RequestInit = {credentials: 'include'};
        const that = this;
        fetch(url, OPTIONS_HTTP_GET).then((data: any) => {
            if (data.status !== 200) {
                Log.trace('App::logout() - authCheck WARNING: Response status: ' + data.status);
                throw new Error('App::logout() - authCheck - API ERROR' + data.status);
            }
            return data.json();
        }).then((result: any) => {
            const LOGOUT_SUCCESS = 'Successfully logged out.';
            Log.trace('App::logout() Logging out... ');
            let logoutResponse = String(result.response);
            if (logoutResponse === LOGOUT_SUCCESS) {
                localStorage.clear();
                console.log('App::logout() Successfully logged out');
                window.location.replace(that.frontendURL);
            }
        }).catch((err: Error) => {
            // just force the logout if we run into a problem
            Log.error('App::logout() - ERROR: ' + err.message);
            Log.error('App::logout() - Clearing localstorage and refreshing');
            localStorage.clear();
            window.location.replace(that.frontendURL);
        });
    }

    private toggleLoginButton() {
        try {
            if (this.isLoggedIn() === false) {
                document.getElementById('indexLogin').style.display = 'none';
            } else {
                document.getElementById('indexLogin').style.display = 'block';
            }
        } catch (err) {
            // silently fail
        }
    }
}

Log.info('App.ts - preparing App for access');
if (typeof classportal === 'undefined') {
    Log.info('App.ts - preparing App; defining globals');
    (<any>window).classportal = {};
    (<any>window).classportal.App = App;
    (<any>window).classportal.UI = UI;
    (<any>window).classportal.Network = Network;
}

(<any>window).myApp = new classportal.App();
(<any>window).myApp.init();
Log.info('App.ts - App prepared');

