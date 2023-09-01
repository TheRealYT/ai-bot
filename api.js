function getRandomToken() {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

function createNewSessionGUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

export default function Bot(email, { bitoUserWsId = '', otpObj = { sixDigitAuthCode: '', newUser: '', userId: '' }, bitoaiToken = '', uIdForXClient = getRandomToken(), currentSessionID = createNewSessionGUID() } = { otpObj: {} }) {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    const relString = "<<B1t0De1im@t0r>>";

    const navigator = {
        platform: 'Win32',
        product: 'Gecko',
        productSub: '20030107'
    }

    const bitoAIUrl = 'https://bitoai.bito.ai/';
    const bitoUTUrl = 'https://ut.bito.ai/';
    const managementAPI = 'https://mgmtapi.bito.ai/';
    const bitoAlpha = 'https://alpha.bito.ai/';

    const environment = {
        currentVersionChrome: "3.3",
        explainCode: bitoAIUrl + 'ai/v1/explaincode/',
        chat: bitoAIUrl + 'ai/v2/chat/',
        aiToken: bitoUTUrl + 'tra/v1/token/',
        tokenAPI: managementAPI + 'api/token',
        verifyOTP: managementAPI + 'api/user/verifyOTP/{email}?otp={otp}',
        userTracker: bitoUTUrl + 'tra/v1/userTracker/',
        saveUserClientInfo: managementAPI + 'api/saveUserClientInfo',
        uninstallTracker: bitoAlpha + 'uninstall/chrome',
        questions: bitoAIUrl + 'ai/v1/questions/',
        feedback: bitoUTUrl + 'tra/v1/eventTracker/',

        joinWorkspace: managementAPI + 'api/work-space/{workspaceId}/work-group/user/{userId}',
        createWorkspace: managementAPI + 'api/work-space?userId={userId}',
        getUserWorkspaces: managementAPI + 'api/work-space/?userId={userId}',
        getDomainWorkspaces: managementAPI + 'api/work-space/?companyDomain={companyDomain}',
        isDomainAllowed: managementAPI + 'api/work-space/isEmailDomainAllowed?email={email}',

        parentIDEName: "Chrome",
    };

    function sendOTP() {
        const myHeaders = new Headers();
        // myHeaders.append("Authorization", 'Bearer ' + bitoaiToken );
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-ClientInfo", `${navigator.platform + ' ' + navigator.product + ' ' + navigator.productSub}#Chrome#${environment.currentVersionChrome}#${uIdForXClient}#${environment.parentIDEName}`);

        const body = {
            "email": email,
            "isAppToken": true,
            "isNewUser": false
        };

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(body),
            redirect: 'follow'
        };

        return new Promise((resolve, reject) => {
            fetch(environment.tokenAPI, requestOptions)
                .then(response => response.text())
                .then(result => {
                    let response = JSON.parse(result);

                    otpObj = {
                        email: email,
                        sixDigitAuthCode: response.invCode,
                        newUser: response.newUser,
                        userId: response.userId
                    };
                    bitoaiToken = response.invCode;
                    resolve(true)
                    // console.log({ 'bitoaiToken': response.invCode, 'bitoaiUserId': response.userId })
                    // console.log({ otpObj: otpObj });
                })
                .catch(error => {
                    reject(error);
                });
        })
    }

    function validateOTP(otpCode) {
        const sixDigitAuthCode = otpObj.sixDigitAuthCode;
        const myHeaders = new Headers();
        myHeaders.append("Authorization", sixDigitAuthCode);
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-ClientInfo", `${navigator.platform + ' ' + navigator.product + ' ' + navigator.productSub}#Chrome#${environment.currentVersionChrome}#${uIdForXClient}#${environment.parentIDEName}`);

        const body = {};

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(body),
            redirect: 'follow'
        };
        return new Promise((resolve, reject) => {

        fetch(environment.verifyOTP.replace('{email}', email).replace('{otp}', otpCode), requestOptions)
            .then(response => response.text())
            .then(result => {
                let response;
                if (result !== "") {
                    response = JSON.parse(result);
                    let companyDomain = email.split('@')[1];
                    if (response.apierror) {
                        reject("Invalid input, Try again");
                    }
                    showWSList(email, sixDigitAuthCode, response.newUser, response.userId, companyDomain).then(() => {
                        resolve(true)
                    }).catch(reason => reject(reason))
                } else {
                    reject('Something went wrong. Reload in 5s');
                }
            })
            .catch(error => {
                reject(error)
            });
        })
    }

    function showWSList(email, sixDigitAuthCode, newUser, userId, companyDomain) {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", sixDigitAuthCode);
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-ClientInfo", `${navigator.platform + ' ' + navigator.product + ' ' + navigator.productSub}#Chrome#3.3#${uIdForXClient}#Chrome`);

        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
        };

        return new Promise((resolve, reject) => {
            try {
                Promise.all([
                    fetch(environment.getUserWorkspaces.replace('{userId}', userId), requestOptions).then(response => response.text()),
                    fetch(environment.getDomainWorkspaces.replace('{companyDomain}', companyDomain), requestOptions).then(response => response.text())
                ])
                    .then(([userWSResult, domainWSResult]) => {
                        let userWS = JSON.parse(userWSResult);
                        let domainWS = JSON.parse(domainWSResult);
                        // Check invitationStatus and move elements to domainWS
                        userWS = userWS.filter(ws => {
                            if (ws.invitationStatus === "INVITATION_SENT" || ws.invitationStatus === "APPROVAL_PENDING") {
                                domainWS.push(ws);
                                return false; // Exclude from userWS
                            }
                            return true; // Include in userWS
                        });
                        if (userWS.length > 0 || domainWS.length > 0) {
                            createWorkspace(email, sixDigitAuthCode, userId).then(f => {
                                f().then(() => {
                                    resolve(true)
                                }).catch(reason => reject(reason))
                            }).catch(reason => reject(reason));
                        } else {
                            createWorkspace(email, sixDigitAuthCode, userId).then(f => {
                                f().then(() => {
                                    resolve(true)
                                }).catch(reason => reject(reason))
                            }).catch(reason => reject(reason));
                        }
                    })
                    .catch(error => {
                        reject(error);
                    });
            } catch (err) {
                reject(err);
            }
        })
    }

    async function createWorkspace(email, sixDigitAuthCode, userId) {
        let isDomainAllowed
        let isDomainCheck = environment.isDomainAllowed.replace("{email}", email)

        const myHeaders = new Headers();
        myHeaders.append("Authorization", sixDigitAuthCode);
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-ClientInfo", `${navigator.platform + ' ' + navigator.product + ' ' + navigator.productSub}#Chrome#3.3#${uIdForXClient}#Chrome`);

        const requestOptions = {
            method: 'GET',
            headers: myHeaders
        }
        await fetch(isDomainCheck, requestOptions).then(response => response.text())
            .then(result => {
                isDomainAllowed = JSON.parse(result);
                // console.log("isDomainAllowed", response)
            })
            .catch(error => {
                throw error
            });

        return () => {
            const myHeaders = new Headers();
            myHeaders.append("Authorization", sixDigitAuthCode);
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("X-ClientInfo", `${navigator.platform + ' ' + navigator.product + ' ' + navigator.productSub}#Chrome#${environment.currentVersionChrome}#${uIdForXClient}#${environment.parentIDEName}`);

            const body = {
                "name": "Test",
                "companyDomain": isDomainAllowed,
            }

            const requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(body)
            };

            return new Promise((resolve, reject) => {
                fetch(environment.createWorkspace.replace('{userId}', userId), requestOptions).then(response => response.text())
                    .then(result => {
                        let response;
                        response = JSON.parse(result);
                        // console.log("Workspace Created", response, response.id, response.name)
                        joinWSClick('', response, email, "Join", userId, sixDigitAuthCode).then(() => resolve(true)).catch(reason => reject(reason))
                    })
                    .catch(error => {
                        reject(error)
                    });
            })
        }
    }

    let wsId
    let wsName
    let usersWorkGroup
    let wgUserList
    let wgId
    let wgName
    let userWorkSpace
    let bitoaiUserEmail

    function joinWSClick(index, WSDetails, email, origin, userId, sixDigitAuthCode) {
        // console.log('workspace ', WSDetails[index]);
        const myHeaders = new Headers();
        myHeaders.append("Authorization", sixDigitAuthCode);
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-ClientInfo", `${navigator.platform + ' ' + navigator.product + ' ' + navigator.productSub}#Chrome#${environment.currentVersionChrome}#${uIdForXClient}#${environment.parentIDEName}`);

        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        return new Promise((resolve, reject) => {
            fetch(
                environment.joinWorkspace
                    .replace('{workspaceId}', (WSDetails[index] || WSDetails).id)
                    .replace('{userId}', userId),
                requestOptions
            )
                .then(response => {
                    return response.json();
                })
                .then(res => {
                    // console.log('joined successfully', res);
                    let statuses = [
                        "APPROVED_BY_OWNER",
                        "INVITATION_ACCEPTED_VIA_URL",
                        "OWNER",
                        "INVITATION_ACCEPTED",
                        "ENABLED",
                        "VERIFIED",
                    ];

                    const userWG = res.workGroups;
                    const strData = JSON.stringify(userWG);
                    const selectedWGUserList = JSON.stringify(userWG[0].users.filter(user => statuses.includes(user.status)));
                    const userSelectedWS = res.workSpaceUser;
                    // console.log("selectedWS = ", JSON.stringify(userSelectedWS));

                    wsId = (WSDetails[index] || WSDetails).id;
                    wsName = (WSDetails[index] || WSDetails).name;
                    usersWorkGroup = strData;
                    wgUserList = selectedWGUserList;
                    wgId = userWG[0].id;
                    wgName = userWG[0].name;
                    userWorkSpace = JSON.stringify(userSelectedWS);
                    bitoaiUserEmail = email;
                    bitoUserWsId = (WSDetails[index] || WSDetails).id;
                    resolve(true)
                }, (err) => {
                    reject(err);
                })
        })
    }

    const context = []

    function getQuestionContext() {
        return context
    }

    function clearContext() {
        context.splice(0, context.length)
    }

    function addToContext(question, answer) {
        if (context.length > 10) context.shift();
        context.push({ question, answer })
    }

    function getAnswer(chatMsg, streamCallback) {
        const myHeaders = new Headers();
        const ctxToPassNew = Array();

        //Creating GUID/UUID in Javascript using ES6 Crypto API
        const QuesGUID = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16))

        // Make the API call using the fetch() function
        myHeaders.set("Authorization", bitoaiToken);
        myHeaders.set("Content-Type", "application/json");
        myHeaders.set("X-ClientInfo", `${navigator.platform + ' ' + navigator.product + ' ' + navigator.productSub}#Chrome#${environment.currentVersionChrome}#${otpObj.userId}#${environment.parentIDEName}`);

        let body;

        if (email) {
            body = {
                "prompt": chatMsg.trim(),
                "uId": "" + otpObj.userId,
                "ideName": "Chrome",
                "bitoUserId": otpObj.userId,
                "email": email,
                "requestId": QuesGUID,
                "stream": true,
                "context": getQuestionContext(),
                "sessionId": currentSessionID,
                "wsId": parseInt(bitoUserWsId),
            }
        } else {
            body = {
                "prompt": chatMsg.trim(),
                "uId": "" + otpObj.userId,
                "ideName": "Chrome",
                "requestId": QuesGUID,
                "stream": true,
                "context": getQuestionContext(),
                "sessionId": currentSessionID
            }
        }

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(body),
            redirect: 'follow',
            signal: abortSignal

        };
        let tempContext_ = '';
        let answerContext_ = '';
        let error_resp;
        const error_resp_status = [1, 2, 3]
        Math.floor(Math.random() * 1000);
        const chunkReceivedMain = Array();

        if (bitoaiToken === 'QklUT0FJLWJrMEJENDM4MDUtNDZFNi00NzMzLUEwQzYtMzJGMDAyMTY0NzMxOjI1MDgtMzg=') {
            return;
        }

        return new Promise((resolve, reject) => {
            fetch(environment.chat, requestOptions)
                .then(response => {
                    if (!response.ok) {
                        response.json().then(error_test => {
                            error_resp = error_test;
                            if (error_resp_status.includes(error_resp.status)) {
                                if (error_resp.response === 'Unauthorized Access')
                                    reject("403 error");
                                reject(error_resp)
                            }
                        })
                        return
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();

                    new ReadableStream({
                        start(controller) {
                            function push() {
                                reader.read().then(({ done, value }) => {
                                    if (done) {
                                        controller.close();
                                        ctxToPassNew.push(tempContext_);
                                        addToContext(chatMsg.trim(), answerContext_)
                                        resolve(answerContext_)
                                        return;
                                    }
                                    const valueData = decoder.decode(value);
                                    answerContext_ = '';
                                    if (valueData.startsWith('data:') || true) {
                                        chunkReceivedMain.push(valueData);
                                        const chunkData = chunkReceivedMain.join('');
                                        const chunkArray = chunkData.replaceAll(/( *)data:( *)/gm, relString).split(relString).filter(r => r);
                                        let dataReceivedTillNow = "";
                                        chunkArray.forEach(chunkVal_ => {
                                            try {
                                                const jsonData = JSON.parse(chunkVal_);
                                                if (jsonData['choices'] !== undefined && jsonData['choices'].length > 0) {
                                                    const Text_ = jsonData.choices[0].text;
                                                    dataReceivedTillNow += Text_;
                                                    tempContext_ += Text_;
                                                    answerContext_ += Text_;
                                                }

                                            } catch (err) {
                                                if (chunkVal_.trim() === "[DONE]") {
                                                } else {
                                                    reject(err);
                                                }
                                            }
                                        });
                                        if (typeof streamCallback == "function")
                                            streamCallback(dataReceivedTillNow)
                                        // console.log(generateCopyId, dataReceivedTillNow);
                                    }
                                    push();
                                });
                            }
                            push();
                        }
                    });
                }).catch(error => {
                    reject(error)
                });
        })
    }

    return {
        sendOTP, validateOTP, getAnswer, clearContext, addToContext, getQuestionContext, getUserData: () => ({ bitoUserWsId, otpObj: { sixDigitAuthCode: otpObj.sixDigitAuthCode, newUser: otpObj.newUser, userId: otpObj.userId }, bitoaiToken, uIdForXClient, currentSessionID })
    }
}