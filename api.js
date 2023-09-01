function getRandomToken() {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

function createNewSessionGUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

function Bot(email, { bitoUserWsId, otpObj: { sixDigitAuthCode, newUser, userId }, bitoaiToken, uIdForXClient = getRandomToken(), currentSessionID = createNewSessionGUID() }) {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    const relString = "<<B1t0De1im@t0r>>";

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
        var myHeaders = new Headers();
        // myHeaders.append("Authorization", 'Bearer ' + bitoaiToken );
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-ClientInfo", `${navigator.platform + ' ' + navigator.product + ' ' + navigator.productSub}#Chrome#${environment.currentVersionChrome}#${uIdForXClient}#${environment.parentIDEName}`);

        var body = {
            "email": email,
            "isAppToken": true,
            "isNewUser": false
        }

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(body),
            redirect: 'follow'
        };

        fetch(environment.tokenAPI, requestOptions)
            .then(response => response.text())
            .then(result => {
                response = JSON.parse(result);

                uIdToPass = response.userId;

                otpObj = {
                    email: email,
                    sixDigitAuthCode: response.invCode,
                    newUser: response.newUser,
                    userId: response.userId
                };
                bitoaiToken = response.invCode;
                // console.log({ 'bitoaiToken': response.invCode, 'bitoaiUserId': response.userId })
                // console.log({ otpObj: otpObj });
            })
            .catch(error => {
                console.error(error);
            });
    }

    function validateOTP(otpCode) {
        var sixDigitAuthCode = otpObj.sixDigitAuthCode
        var myHeaders = new Headers();
        myHeaders.append("Authorization", sixDigitAuthCode);
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-ClientInfo", `${navigator.platform + ' ' + navigator.product + ' ' + navigator.productSub}#Chrome#${environment.currentVersionChrome}#${uIdForXClient}#${environment.parentIDEName}`);

        var body = {}

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(body),
            redirect: 'follow'
        };
        fetch(environment.verifyOTP.replace('{email}', email).replace('{otp}', otpCode), requestOptions)
            .then(response => response.text())
            .then(result => {

                if (result !== "") {
                    response = JSON.parse(result);
                    let companyDomain = email.split('@')[1];

                    if (response.apierror) {
                        console.error("Invalid input, Try again");
                    }
                    showWSList(email, sixDigitAuthCode, response.newUser, response.userId, companyDomain);
                } else {
                    console.error('Something went wrong. Reload in 5s');
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function showWSList(email, sixDigitAuthCode, newUser, userId, companyDomain) {
        var myHeaders = new Headers();
        myHeaders.append("Authorization", sixDigitAuthCode);
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-ClientInfo", `${window.navigator.platform + ' ' + window.navigator.product + ' ' + window.navigator.productSub}#Chrome#3.3#${uIdForXClient}#Chrome`);

        var requestOptions = {
            method: 'GET',
            headers: myHeaders,
        };
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
                        createWorkspace(email, sixDigitAuthCode, userId).then(f => f());
                    } else {
                        createWorkspace(email, sixDigitAuthCode, userId).then(f => f());
                    }
                })
                .catch(error => {
                    console.log("Error while getting workspaces", error);
                });
        } catch (err) {
            console.log("Error while getting user workspaces", err);
        }
    }

    async function createWorkspace(email, sixDigitAuthCode, userId) {
        let isDomainAllowed
        let isDomainCheck = environment.isDomainAllowed.replace("{email}", email)

        var myHeaders = new Headers();
        myHeaders.append("Authorization", sixDigitAuthCode);
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-ClientInfo", `${window.navigator.platform + ' ' + window.navigator.product + ' ' + window.navigator.productSub}#Chrome#3.3#${uIdForXClient}#Chrome`);

        var requestOptions = {
            method: 'GET',
            headers: myHeaders
        }
        await fetch(isDomainCheck, requestOptions).then(response => response.text())
            .then(result => {
                response = JSON.parse(result);
                isDomainAllowed = response;
                // console.log("isDomainAllowed", response)
            })
            .catch(error => {
                console.log("Domain check failed", error)
            });

        return () => {
            var myHeaders = new Headers();
            myHeaders.append("Authorization", sixDigitAuthCode);
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("X-ClientInfo", `${window.navigator.platform + ' ' + window.navigator.product + ' ' + window.navigator.productSub}#Chrome#${environment.currentVersionChrome}#${uIdForXClient}#${environment.parentIDEName}`);

            var body = {
                "name": "Test",
                "companyDomain": isDomainAllowed,
            }

            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(body)
            };

            fetch(environment.createWorkspace.replace('{userId}', userId), requestOptions).then(response => response.text())
                .then(result => {
                    response = JSON.parse(result);
                    // console.log("Workspace Created", response, response.id, response.name)
                    joinWSClick('', response, email, "Join", userId, sixDigitAuthCode)
                })
                .catch(error => {
                    console.log("Workspace not Created", error)
                });
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
    let bitoUserWsId

    async function joinWSClick(index, WSDetails, email, origin, userId, sixDigitAuthCode) {
        // console.log('workspace ', WSDetails[index]);
        var myHeaders = new Headers();
        myHeaders.append("Authorization", sixDigitAuthCode);
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-ClientInfo", `${navigator.platform + ' ' + navigator.product + ' ' + navigator.productSub}#Chrome#${environment.currentVersionChrome}#${uIdForXClient}#${environment.parentIDEName}`);

        var requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

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

                var userWG = res.workGroups;
                var strData = JSON.stringify(userWG);
                var selectedWGUserList = JSON.stringify(userWG[0].users.filter(user => statuses.includes(user.status)));
                var userSelectedWS = res.workSpaceUser;
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
            }, (err) => {
                console.log('error', err);
            })
    }

    const context = [{
        question: "Hello, who are you?",
        answer: "I am an AI created by Bito. How can I help you today?"
    }]

    function getQuestionContext() {
        return context
    }

    function addToContext(question, answer) {
        if (context.length > 10) context.shift();
        context.push(question, answer)

        console.log(answer)
    }

    function getAnswer(chatMsg) {
        var myHeaders = new Headers();
        var ctxToPassNew = Array();

        //Creating GUID/UUID in Javascript using ES6 Crypto API 
        var QuesGUID = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16))

        // Make the API call using the fetch() function
        myHeaders.set("Authorization", bitoaiToken);
        myHeaders.set("Content-Type", "application/json");
        myHeaders.set("X-ClientInfo", `${navigator.platform + ' ' + navigator.product + ' ' + navigator.productSub}#Chrome#${environment.currentVersionChrome}#${uIdToPass}#${environment.parentIDEName}`);

        var body = {};

        if (email) {
            body = {
                "prompt": chatMsg.trim(),
                "uId": "" + uIdToPass,
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
                "uId": "" + uIdToPass,
                "ideName": "Chrome",
                "requestId": QuesGUID,
                "stream": true,
                "context": getQuestionContext(),
                "sessionId": currentSessionID
            }
        }

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(body),
            redirect: 'follow',
            signal: abortSignal

        };
        var tempContext_ = '';
        var answerContext_ = '';
        var error_resp;
        var error_resp_status = [1, 2, 3]
        var generateCopyId = Math.floor(Math.random() * 1000);

        targetAnswerDivIdForErrorMessage = generateCopyId;
        var chunkReciedMain = Array();

        if (bitoaiToken == 'QklUT0FJLWJrMEJENDM4MDUtNDZFNi00NzMzLUEwQzYtMzJGMDAyMTY0NzMxOjI1MDgtMzg=') {
            return;
        }

        fetch(environment.chat, requestOptions)
            .then(response => {
                if (!response.ok) {
                    response.json().then(error_test => {
                        error_resp = error_test;
                        if (error_resp_status.includes(error_resp.status)) {
                            if (error_resp.response == 'Unauthorized Access')
                                console.error("403 error");
                            console.error(generateCopyId, error_resp.response);
                            console.error(generateCopyId);
                        }
                    })
                }


                var reader = response.body.getReader();
                var decoder = new TextDecoder();

                return new ReadableStream({
                    start(controller) {
                        function push() {
                            reader.read().then(({ done, value }) => {
                                if (done) {
                                    controller.close();
                                    ctxToPassNew.push(tempContext_);
                                    addToContext(chatMsg.trim(), answerContext_)
                                    return;
                                }
                                var valuedata = decoder.decode(value);
                                answerContext_ = '';
                                if (valuedata.startsWith('data:') || true) {
                                    chunkReciedMain.push(valuedata);
                                    var chunkData = chunkReciedMain.join('');
                                    var chunkArray = chunkData.replaceAll(/( *)data:( *)/gm, relString).split(relString).filter(r => r);
                                    var dataReceivedTillNow = "";
                                    chunkArray.forEach(chunkVal_ => {
                                        try {
                                            var jsonData = JSON.parse(chunkVal_);
                                            if (jsonData['choices'] !== undefined && jsonData['choices'].length > 0) {
                                                var Text_ = jsonData.choices[0].text;
                                                dataReceivedTillNow += Text_;
                                                tempContext_ += Text_;
                                                answerContext_ += Text_;
                                            }

                                        } catch (err) {
                                            if (chunkVal_.trim() == "[DONE]") {
                                            }
                                            else {
                                                console.error("Error Occured!!!!", err, "Value Data =>", chunkVal_, "<=");
                                            }
                                        }
                                    });
                                    // console.log(generateCopyId, dataReceivedTillNow);
                                }
                                push();
                            });
                        }
                        push();
                    }
                });
            }).catch(error => {
                console.error(error.name, error.message)
                if (error.message == 'Failed to fetch' || error.message == 'NetworkError when attempting to fetch resource.' || error.message == 'network error') {
                    console.error(generateCopyId, 'Unable to connect to the internet. Please check your network connection and try again.');
                    return;
                }
                console.error(generateCopyId, "Whoops, looks like your request is timing out. Our service has been growing quickly, and we are having some growing pains. We are working to add more capacity. Sorry for any inconvenience. Please try again a little later.")
            });
    }

    return {
        sendOTP, validateOTP, getAnswer
    }
}