var app = angular.module("gameApp", ['ngPatternRestrict', 'ui.sortable']).filter('makePositive', function () {
    return function (num) { return Math.abs(num); }
});;

app.controller('gameController', function ($scope, $interval, $window) {
    var game = this;
    game.newPlayer = '';
    game.playerImage = '';
    game.playeredit = null;
    game.sounds = true;
    game.initialPoint = 0;
    game.viewReport = false;
    game.filterPayments = '';
    game.winnerAudio = new Audio("sounds/winner.wav");
    game.winnerAudio.preload = "auto";
    game.multiplierIntroAudio = new Audio("sounds/doublegameInro.wav");
    game.multiplierIntroAudio.preload = "auto";
    //game.multiplierAudio = new Audio("sounds/doublegame.wav");
    //game.multiplierAudio.loop = true;
    game.highestPointAudio = new Audio("sounds/highestPoint.wav");
    game.highestPayAudio = new Audio("sounds/highestPay.wav");
    game.paymentAudio = new Audio("sounds/payment.wav");
    game.data = {
        participants: [],
        multiplierThreshold: 25,
        multiplier: 1,
        payinterval: 50,
        displayPayments: [],
        payments: [],
        records: [],
        dashboard: {
            rounds: 0,
            roundsToday: 0,
            highestPoint: 0,
            highestPointPlayer: '',
            participants: [],
            highestPay: 0,
            highestPayPlayer: '',
            doublegame: 0,
            doublegameToday: 0,
        },
    }

    var tick = function () {
        $scope.clock = Date.now();
    }
    tick();
    $interval(tick, 1000);

    game.loadLocalData = function () {

        if ($window.localStorage.getItem("participants")) {

            game.data.participants = JSON.parse($window.localStorage.getItem("participants"));
            game.data.multiplierThreshold = JSON.parse($window.localStorage.getItem("multiplierThreshold"));
            game.data.multiplier = JSON.parse($window.localStorage.getItem("multiplier"));
            game.data.payinterval = JSON.parse($window.localStorage.getItem("payinterval"));
            game.data.displayPayments = JSON.parse($window.localStorage.getItem("displayPayments"));
            game.data.payments = JSON.parse($window.localStorage.getItem("payments"));
            game.data.records = JSON.parse($window.localStorage.getItem("records"));
            game.data.dashboard = JSON.parse($window.localStorage.getItem("dashboard"));
            game.sounds = JSON.parse($window.localStorage.getItem("sounds"));

            game.updateDashboard_updateRoundsToday();
        }
    }

    game.updateLocalData = function () {
        try {
            $window.localStorage.setItem("participants", JSON.stringify(game.data.participants));
            $window.localStorage.setItem("multiplierThreshold", JSON.stringify(game.data.multiplierThreshold));
            $window.localStorage.setItem("multiplier", JSON.stringify(game.data.multiplier));
            $window.localStorage.setItem("payinterval", JSON.stringify(game.data.payinterval));
            $window.localStorage.setItem("displayPayments", JSON.stringify(game.data.displayPayments));
            $window.localStorage.setItem("payments", JSON.stringify(game.data.payments));
            $window.localStorage.setItem("records", JSON.stringify(game.data.records));
            $window.localStorage.setItem("dashboard", JSON.stringify(game.data.dashboard));
            $window.localStorage.setItem("sounds", JSON.stringify(game.sounds));
        }
        catch (e) {
            alert("Local Storage is full, Changes will not be saved automatically");
        }
    }

    game.resetData = function () {
        $window.localStorage.clear();
        game.data = {
            participants: [],
            multiplierThreshold: 25,
            multiplier: 1,
            payinterval: 50,
            displayPayments: [],
            payments: [],
            records: [],
            dashboard: {
                rounds: 0,
                roundsToday: 0,
                highestPoint: 0,
                highestPointPlayer: '',
                participants: [],
                highestPay: 0,
                highestPayPlayer: '',
                doublegame: 0,
                doublegameToday: 0,
            },
        }
    }

    game.movePlayerDown = function (item) {
        var index = game.data.participants.indexOf(item);
        var newIndex = index + 1;
        if (newIndex > game.data.participants.length - 1)
            newIndex = 0;

        game.data.participants.splice(index, 1);
        game.data.participants.splice(newIndex, 0, item);
        game.updateLocalData();
    }

    game.movePlayerUp = function (item) {
        var index = game.data.participants.indexOf(item);
        var newIndex = index - 1;
        if (newIndex < 0)
            newIndex = game.data.participants.length - 1;

        game.data.participants.splice(index, 1);
        game.data.participants.splice(newIndex, 0, item);
        game.updateLocalData();
    }

    game.resetInput = function () {
        game.data.participants.forEach(player => {
            player.points = null;
            player.winner = false;
            player.show = false;
            player.joot = false;
            player.pay = 0;
        });
    }

    game.deleteRecord = function (item) {
        if (game.data.records.length > 1) {
            item.participants.forEach(oldplayer => {
                var player = game.data.dashboard.participants.filter(obj => obj.id == oldplayer.id);
                if (player.length > 0) {
                    player = player[0];
                    player.pay = oldplayer.pay;
                    if (oldplayer.show) {
                        player.show = player.show > 0 ? player.show - 1 : 0;
                    }
                    if (oldplayer.winner) {
                        player.winner = player.winner > 0 ? player.winner - 1 : 0;
                    }
                    if (oldplayer.joot) {
                        player.joot = player.joot > 0 ? player.joot - 1 : 0;
                    }
                }
            });

            if (item.multiplier && item.multiplier == 2 && game.data.dashboard.doublegame > 0) {
                game.data.dashboard.doublegame--;
            }

            if (game.data.records.length > 0) {
                var lastgame = game.data.records[1];
                lastgame.participants.forEach(element => {
                    var lastplayer = game.data.dashboard.participants.filter(obj => obj.id == element.id);
                    if (lastplayer.length > 0) {
                        lastplayer = lastplayer[0];
                        lastplayer.pay = element.pay;
                    }
                });
            }

            game.data.dashboard.rounds = game.data.dashboard.rounds > 0 ? game.data.dashboard.rounds - 1 : 0;

            game.data.records = game.data.records.filter(obj => obj !== item);
            game.updateDashboard_updateRoundsToday();
            game.updateLocalData();
        } else {
            alert("You cannot delete the last record. Please create a new game if necessary.");
        }
    }

    game.changeDealer = function (item) {
        item.dealer = true;
        game.data.participants.forEach(player => {
            if (item.id !== player.id) {
                player.dealer = false;
            }
        });
        game.updateLocalData();
    }

    game.autoChangeDealer = function () {
        var dealer = game.data.participants.filter(obj => obj.dealer == true);
        if (dealer.length > 0)
            dealer = dealer[0];

        if (dealer != null) {
            var participants = game.data.participants.filter(obj => obj.active == true);
            var index = participants.indexOf(dealer);
            var nextDealer = participants[index + 1];
            if (nextDealer == null) {
                nextDealer = participants[0];
            }
            nextDealer.dealer = true;
            game.data.participants.forEach(player => {
                if (nextDealer.id !== player.id) {
                    player.dealer = false;
                }
            });

        }
    }

    game.changeWinner = function (item) {
        item.show = true;
        game.data.participants.forEach(player => {
            if (item.id !== player.id) {
                player.winner = false;
            }
        });
    }

    game.changeShow = function (item) {
        if (item.joot == true) {
            item.joot = false
        }
        item.points = 0;
    }

    game.isPair = function (player) {
        if (player.joot) {
            player.show = true;
        }
    }

    game.changePoints = function (item) {
        if (item.points === 0) {
            item.points = null;
        } else if (item.points > 0) {
            item.show = true;
        }

        var haveWinner = false;
        game.data.participants.forEach(player => {
            if (player.winner == true) {
                haveWinner = true;
            }
        });
        if (!haveWinner) {
            item.winner = true;
        }
    }

    game.addPlayer = function (name, initialpoints) {
        if (name != '') {
            const newPlayer = {
                id: game.data.participants.length + 1,
                name: name,
                winner: false,
                show: false,
                joot: false,
                points: null,
                pay: 0,
                dealer: false,
                active: true,
            }
            game.data.participants.push(newPlayer);
            game.newPlayer = '';
            game.initialPoint = 0;

            if (game.data.records.length === 0) {
                var report = {
                    round: 0,
                    totalPoints: 0,
                    participants: []
                }
                const player = {
                    id: newPlayer.id,
                    name: newPlayer.name,
                    winner: false,
                    show: false,
                    joot: false,
                    points: 0,
                    pay: initialpoints,
                    dealer: false,
                    active: true,
                }
                report.participants.push(player);
                game.data.records.push(report);
            } else if (game.data.records.length === 1) {
                var initial = game.data.records.filter(obj => obj.round == 0);
                if (initial.length > 0) {
                    initial = initial[0];
                    const player = {
                        id: newPlayer.id,
                        name: newPlayer.name,
                        winner: false,
                        show: false,
                        joot: false,
                        points: 0,
                        pay: initialpoints,
                        dealer: false,
                        active: true,
                    }
                    initial.participants.push(player);
                }
            }

            game.updateLocalData();
        }
    }

    game.deletePlayer = function (player) {
        if (player.active) {
            player.active = false;
        } else {
            player.active = true;
        }

        game.updateLocalData();
    }

    game.closePayout = function (payment) {
        game.data.displayPayments = game.data.displayPayments.filter(obj => obj != payment);
        game.updateLocalData();
    }

    game.download = function () {
        var a = document.createElement("a");
        var file = new Blob([JSON.stringify(game.data)], { type: 'application/json' });
        a.href = URL.createObjectURL(file);
        a.download = "GameData_" + Date.now();
        a.click();
    }

    game.editPlayer = function (player) {
        game.playeredit = angular.copy(player);
        var element = angular.element('#playerModal');
        element.modal('show');
    }

    $scope.selectPlayerImage = function (e) {
        const fi = document.getElementById('imagefile');
        // Check if any file is selected. 
        if (fi.files.length > 0) {
            const fsize = fi.files.item(0).size;
            const file = Math.round((fsize / 1024));
            // The size of the file. 
            if (file >= 1024) {
                alert("File too Big, please select a file less than 1mb");
            } else {
                var reader = new FileReader();
                reader.onload = function (e) {
                    game.playeredit.image = e.target.result;
                    var playerDash = game.data.dashboard.participants.filter(obj => obj.id == game.playeredit.id);
                    if (playerDash.length > 0) {
                        playerDash = playerDash[0];
                        playerDash.image = game.playeredit.image;
                    }
                    game.updateLocalData();
                    $scope.$apply();
                };

                reader.readAsDataURL(e.target.files[0]);
            }
        }
    }

    game.upload = function () {
        if (document.getElementById('file').files.length > 0) {
            var f = document.getElementById('file').files[0],
                r = new FileReader();
            r.onloadend = function (e) {
                var data = e.target.result;
                var parsedData = JSON.parse(data);
                if (parsedData.records && parsedData.records.length > 100) {
                    parsedData.records.length = 100;
                }
                parsedData.participants.forEach(element => {
                    if (element.image) {
                        delete element.image;
                    }
                });

                parsedData.records.forEach(element => {
                    element.participants.forEach(player => {
                        if (player.image) {
                            delete player.image;
                        }
                    });
                });

                game.data = parsedData;

                game.updateDashboard_updateRoundsToday();
                game.data.dashboard.doublegameToday = 0;
                if (game.data.dashboard.doublegame == null) {
                    game.data.dashboard.doublegame = 0;
                }

                game.updateLocalData();

                $scope.$apply();
            }

            r.readAsBinaryString(f);
        }
    }

    game.drawPlayerChart = function () {

        var x = document.getElementById("report");
        if (x.style.display === "none") {
            x.style.display = "block";
        } else {
            x.style.display = "none";
        }

        if (!game.viewReport) {
            game.viewReport = true;
            game.data.participants.forEach(player => {
                var playerData = [];
                if (game.data.payments != null && game.data.payments.length > 0) {
                    pdata = game.data.payments.filter(obj => obj.user.id == player.id);

                    var tempData = [];
                    if (pdata.length > 0) {
                        pdata.forEach(element => {
                            var dt = new Date(element.date);
                            var d = {
                                date: dt.getFullYear() + "-" + dt.getMonth() + "-" + dt.getDay(),
                                points: element.points
                            }
                            tempData.push(d);
                        });
                    }

                    let array = tempData,
                        result = Object.values(array.reduce((a, { date, points }) => {
                            a[date] = (a[date] || { date, points: 0 });
                            a[date].points = Number(a[date].points) + Number(points);
                            return a;
                        }, {}));

                    if (result.length > 0) {
                        result.forEach(game => {
                            var dt = new Date(game.date);
                            var row = [
                                new Date(dt.getFullYear(), dt.getMonth()),
                                game.points
                            ];

                            playerData.push(row);
                        });
                    }
                }
                drawChart(player, playerData);
            });
        } else {
            game.viewReport = false;
        }
    }

    game.calculate = function () {

        var payout = false;
        var payusers = [];
        var activePlayers = game.data.participants.filter(obj => obj.active == true);
        if (activePlayers.length > 1) {
            var totalPoints = 0;
            //Total Points
            game.data.participants.forEach(item => {
                if (item.show || item.winner) {
                    totalPoints += item.points
                }
            });

            //Dealer
            var dealer = game.data.participants.filter(obj => obj.dealer === true && obj.active === true);
            if (dealer.length > 0) {
                //Payout
                var winner = game.data.participants.filter(obj => obj.winner === true && obj.active == true);
                var winnerPay = 0;
                if (winner.length === 1) {
                    var winner = winner[0];
                    if (winner.joot) {
                        totalPoints += 5;
                    }

                    //multiplier
                    if (game.data.multiplier == 2) {
                        game.data.dashboard.doublegame++;
                        game.data.dashboard.doublegameToday++;
                    }

                    game.data.participants.forEach(looser => {
                        if (looser.active == false) {
                            if (game.data.records != null && game.data.records.length > 0) {
                                var lastGame = game.data.records[0];
                                if (lastGame != null) {
                                    var user = lastGame.participants.filter(obj => obj.id === looser.id);
                                    if (user != null && user.length > 0) {
                                        user = user[0];
                                        looser.show = false;
                                        looser.winner = false;
                                        looser.joot = false;
                                        looser.points = 0;
                                        looser.pay = user.pay;
                                    }
                                }
                            }
                        } else {
                            if (!looser.winner && looser.active == true) {
                                var winnerPoint = 10;
                                var total = 0;
                                if (looser.joot) {
                                    winnerPoint = 0;
                                } else if (looser.show) {
                                    winnerPoint = 3;
                                }
                                total = totalPoints + winnerPoint;
                                looser.pay = ((game.data.participants.length * looser.points) - total) * game.data.multiplier;
                                winnerPay += looser.pay;
                            }
                        }
                    });

                    winner.pay = winnerPay * -1;
                    var round = 0;
                    if (game.data.records.length > 0) {
                        var roundgame = game.data.records[0];
                        if (!roundgame.round >= 0)
                            round = roundgame.round + 1;
                    }
                    var report = {
                        round: round,
                        multiplier: 1,
                        totalPoints: totalPoints,
                        participants: []
                    }

                    if (game.data.multiplier == 2) {
                        report.multiplier = 2;
                    }

                    report.participants = angular.copy(game.data.participants);

                    if (game.data.records && game.data.records.length > 0) {
                        var lastGame = game.data.records[0];
                        if (lastGame) {
                            report.participants.forEach(currentPlayer => {
                                if (currentPlayer.active) {
                                    if (lastGame.participants && lastGame.participants.length > 0) {
                                        var lastPlayer = lastGame.participants.filter(obj => obj.id === currentPlayer.id);
                                        if (lastPlayer != null && lastPlayer.length > 0) {
                                            lastPlayer = lastPlayer[0];
                                            currentPlayer.pay = currentPlayer.pay + lastPlayer.pay;

                                            if (currentPlayer.pay <= (game.data.payinterval * -1)) {
                                                payout = true;
                                                payusers.push(currentPlayer);
                                                currentPlayer.pay = currentPlayer.pay + game.data.payinterval;
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    }

                    report.date = Date.now();
                    //payments
                    if (game.data.payinterval > 0) {
                        if (payout == true && payusers.length > 0) {
                            payusers.forEach(payuser => {
                                //get receiving player
                                highestPoint = 0;
                                highestPointUser = null;
                                report.participants.forEach(user => {
                                    if (user.pay > highestPoint) {
                                        highestPoint = user.pay;
                                        highestPointUser = user;
                                    }
                                });

                                if (highestPointUser != null) {
                                    highestPointUser.pay = highestPointUser.pay - game.data.payinterval;
                                    var displayPayment = {
                                        pay: payuser,
                                        receive: highestPointUser,
                                    }
                                    game.data.displayPayments.push(displayPayment);
                                    if (game.sounds) {
                                        setTimeout(() => {
                                            game.paymentAudio.play();
                                        }, 2000);
                                    }
                                    var paymentPay = {
                                        round: report.round,
                                        user: payuser,
                                        points: (game.data.payinterval * -1),
                                        date: Date.now()
                                    }
                                    var paymentReceive = {
                                        round: report.round,
                                        user: highestPointUser,
                                        points: game.data.payinterval,
                                        date: Date.now()
                                    }
                                    if (game.data.payments == null || game.data.payments == undefined) {
                                        game.data.payments = [];
                                    }
                                    game.data.payments.push(paymentPay);
                                    game.data.payments.push(paymentReceive);
                                    if (game.data.payments.length > 50) {
                                        game.data.payments.pop();
                                    }
                                    //Dashboard
                                    var dashboardPay = game.data.dashboard.participants.filter(obj => obj.id == paymentPay.user.id);
                                    if (dashboardPay.length > 0) {
                                        dashboardPay = dashboardPay[0];
                                        dashboardPay.points += paymentPay.points;
                                    }
                                    var dashboardReceive = game.data.dashboard.participants.filter(obj => obj.id == paymentReceive.user.id);
                                    if (dashboardReceive.length > 0) {
                                        dashboardReceive = dashboardReceive[0];
                                        dashboardReceive.points += paymentReceive.points;
                                    }
                                    game.updateDashboard_updateHighestPay();
                                }
                            });
                        }
                    }

                    game.updateDashboard(report);
                    game.data.records.unshift(report);
                    if (game.data.records.length > 100)
                        game.data.records.pop();

                    //multiplier
                    if (game.data.multiplierThreshold > 0) {
                        var multiplied = false;
                        game.data.participants.forEach(player => {
                            if (player.points >= game.data.multiplierThreshold) {
                                multiplied = true;
                            }
                        });
                        if (multiplied) {
                            game.data.multiplier = 2;
                            if (game.sounds) {
                                game.changeMultiplier();
                            }
                        }
                        else {
                            game.data.multiplier = 1;
                            game.changeMultiplier();
                            if (game.sounds) {
                                game.winnerAudio.play();
                            }
                        }
                    }

                    //Change Dealer
                    game.autoChangeDealer();
                    game.updateLocalData();


                } else {
                    alert("Invalid Winner");
                }
            } else {
                alert("Please select the dealer");
            }
        } else {
            alert("There must be at least two active players");
        }
    }


    game.updateDashboard = function (report) {
        if (game.data.dashboard == null) {
            game.data.dashboard = {
                rounds: 0,
                roundsToday: 0,
                highestPoint: 0,
                highestPointPlayer: '',
                participants: [],
            }

            //Rounds
            game.data.dashboard.rounds = game.data.records.length;
            //RoundsToday
            game.updateDashboard_updateRoundsToday();
            //Highest Point
            game.updateDashboard_updateHighestPoint();
            //Highest Pay
            game.updateDashboard_updateHighestPay();

            //participants
            if (game.data.records.length > 0) {
                var lastGame = game.data.records[0];
                lastGame.participants.forEach(element => {
                    var player = {
                        id: element.id,
                        name: element.name,
                        winner: element.winner ? 1 : 0,
                        winnerToday: element.winner ? 1 : 0,
                        show: element.show ? 1 : 0,
                        showToday: element.showToday ? 1 : 0,
                        joot: element.joot ? 1 : 0,
                        jootToday: element.jootToday ? 1 : 0,
                        points: 0,
                        pay: element.pay,
                        paystatus: '',
                    }
                    game.data.dashboard.participants.push(player);
                });
            } else {
                game.data.participants.forEach(element => {
                    var player = {
                        id: element.id,
                        name: element.name,
                        winner: element.winner ? 1 : 0,
                        winnerToday: element.winner ? 1 : 0,
                        show: element.show ? 1 : 0,
                        showToday: element.showToday ? 1 : 0,
                        joot: element.joot ? 1 : 0,
                        jootToday: element.jootToday ? 1 : 0,
                        points: 0,
                        pay: element.pay,
                        paystatus: '',
                    }
                    game.data.dashboard.participants.push(player);
                });
            }

        } else {
            if (report != null) {

                //Rounds
                game.data.dashboard.rounds++;
                //RoundsToday
                game.data.dashboard.roundsToday++;
                //HighestPoint
                var hpoints = game.data.dashboard.highestPoint;
                var hplayer = game.data.dashboard.highestPointPlayer;
                report.participants.forEach(element => {
                    if (element.points >= hpoints) {
                        hpoints = element.points;
                        hplayer = element.name;
                    }
                });

                if (game.sounds && hplayer != game.data.dashboard.highestPointPlayer) {
                    setTimeout(() => {
                        game.highestPointAudio.play();
                    }, 5000);
                }

                game.data.dashboard.highestPoint = hpoints;
                game.data.dashboard.highestPointPlayer = hplayer;


                //participants
                report.participants.forEach(element => {
                    var player = game.data.dashboard.participants.filter(obj => obj.id == element.id);
                    if (player.length > 0) {
                        player = player[0];
                        if (player.winnerToday == null)
                            player.winnerToday = 0;
                        if (player.showToday == null)
                            player.showToday = 0;
                        if (player.jootToday == null)
                            player.jootToday = 0;
                        if (player.paystatus == null)
                            player.paystatus = '';
                        player.paystatus = player.pay < element.pay ? 'up' : (player.pay > element.pay ? 'down' : '');
                        player.pay = element.pay;
                        player.winner = element.winner ? player.winner + 1 : player.winner;
                        player.winnerToday = element.winner ? player.winnerToday + 1 : player.winnerToday;
                        player.show = element.show ? player.show + 1 : player.show;
                        player.showToday = element.show ? player.showToday + 1 : player.showToday;
                        player.joot = element.joot ? player.joot + 1 : player.joot;
                        player.jootToday = element.joot ? player.jootToday + 1 : player.jootToday;
                    } else {
                        var newPlayer = {
                            id: element.id,
                            name: element.name,
                            winner: element.winner ? 1 : 0,
                            winnerToday: element.winnerToday ? 1 : 0,
                            show: element.show ? 1 : 0,
                            showToday: element.showToday ? 1 : 0,
                            joot: element.joot ? 1 : 0,
                            jootToday: element.jootToday ? 1 : 0,
                            points: 0,
                            pay: element.pay,
                            paystatus: '',
                        }
                        game.data.dashboard.participants.push(newPlayer);
                    }
                });
            }
        }
    }

    game.updateDashboard_updateRoundsToday = function () {
        const today = new Date()
        var count = 0;
        var doublegameCount = 0;
        game.data.dashboard.doublegameToday = 0;
        game.data.dashboard.participants.forEach(item => {
            item.winnerToday = 0;
            item.showToday = 0;
            item.jootToday = 0;
        });

        game.data.records.forEach(element => {
            var date = new Date(element.date);
            if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
                count++;
                if (element.multiplier && element.multiplier == 2) {
                    doublegameCount++;
                }
                element.participants.forEach(win => {

                    win.winnerToday = element.winnerToday ? element.winnerToday : 0;
                    win.showToday = element.showToday ? element.showToday : 0;
                    win.jootToday = element.jootToday ? element.jootToday : 0;

                    var player = game.data.dashboard.participants.filter(obj => obj.id == win.id);
                    if (player.length > 0) {
                        player = player[0];
                    }
                    if (win.winner) {
                        if (player.winnerToday == null) {
                            player.winnerToday = 0;
                        }
                        player.winnerToday++;
                    }
                    if (win.show) {
                        if (player.showToday == null) {
                            player.showToday = 0;
                        }
                        player.showToday++;
                    }
                    if (win.joot) {
                        if (player.jootToday == null) {
                            player.jootToday = 0;
                        }
                        player.jootToday++;
                    }
                });
            }
        });

        game.data.dashboard.roundsToday = count;
        game.data.dashboard.doublegameToday = doublegameCount;
    }

    game.updateDashboard_updateHighestPoint = function () {
        var highestPoint = 0;
        var highestPointPlayer = '';
        game.data.records.forEach(element => {
            element.participants.forEach(player => {
                if (player.points > highestPoint) {
                    highestPoint = player.points;
                    highestPointPlayer = player.name;
                }
            });
        });

        game.data.dashboard.highestPoint = highestPoint;
        game.data.dashboard.highestPointPlayer = highestPointPlayer;
    }

    game.updateDashboard_updateHighestPay = function () {
        var pay = 0;
        var player = '';
        game.data.dashboard.participants.forEach(element => {
            if (element.points >= pay) {
                pay = element.points;
                player = element.name;
            }
        });

        if (game.sounds && game.data.dashboard.highestPayPlayer != player) {
            setTimeout(() => {
                game.highestPayAudio.play();
            }, 3000);
        }

        game.data.dashboard.highestPay = pay;
        game.data.dashboard.highestPayPlayer = player;
    }

    //Sounds
    game.changeMultiplier = function () {
        if (game.data.multiplier == 2 && game.sounds) {
            game.multiplierIntroAudio.play();
        }
    }

});