var projectOverviewGadget = undefined;
projectOverviewGadget || (projectOverviewGadget = AJS.Gadget({
    baseUrl: 'http://jira.swisscom.com',
    view: {
        onResizeAdjustHeight: true,
        template: function () {
            var templateReference = this;
            var $ = AJS.$;

            var config = {
                project: 'SAM',
                team: 'Catta',
                version: '2016.05 C'
            };

            init();

            function setContent(string) {
                $('#overview_epics').append('<div>' + string + '</div>');
            }

            function drawChart(epicData) {
                google.charts.load('current', {packages: ['corechart', 'bar']});
                google.charts.setOnLoadCallback(drawBarColors);

                function drawBarColors() {
                    var temp = [['Epic', 'PD Total', 'PD Done']];
                    epicData.forEach(function (entry) {
                        temp.push(entry);
                    });
                    var data = google.visualization.arrayToDataTable(temp);

                    var options = {
                        title: 'Catta Projects for 2016.05 C',
                        chartArea: {width: '80%'},
                        colors: ['#999999', '#11aa22'],
                        hAxis: {
                            title: 'Progress',
                            minValue: 0
                        },
                        vAxis: {
                            title: 'Epic'
                        }
                    };
                    var chart = new google.visualization.BarChart(document.getElementById('overview_epics_chart'));
                    chart.draw(data, options);
                }
            }

            function init() {
                drawChart([
                    ['a', 100, 10],
                    ['b', 200, 10]
                ]);


                var epics = [];
                window.jiraUtils.getEpics(config.project, config.version, config.team)
                    .then(function (epicResponse) {
                        epics = window.jiraUtils.getIssuesFromResponse(epicResponse);
                        var calls = [];
                        var deferred = Q.defer();

                        epics.forEach(function (epic) {
                            calls.push(window.jiraUtils.getStories(epic.key));
                        });

                        window.Q.all(calls).then(function (storyResponses) {
                            var stories = storyResponses.map(function (storyResponse) {
                                return window.jiraUtils.getIssuesFromResponse(storyResponse);
                            });
                            stories.forEach(function (story, i) {
                                epics[i].children = story;
                            });
                            deferred.resolve([].concat.apply([], stories));
                        });
                        return deferred.promise;
                    })
                    .then(function (stories) {
                        var calls = [];
                        var deferred = Q.defer();

                        stories.forEach(function (story) {
                            calls.push(window.jiraUtils.getSubtasks(story.key));
                        });

                        window.Q.all(calls).then(function (subtaskResponses) {
                            var subtasks = subtaskResponses.map(function (subtaskResponse) {
                                return window.jiraUtils.getIssuesFromResponse(subtaskResponse);
                            });
                            subtasks.forEach(function (subtask, i) {
                                stories[i].children = subtask;
                            });
                            deferred.resolve([].concat.apply([], subtasks));
                        });
                        return deferred.promise;
                    })
                    .then(function (subtasks) {
                        setContent(JSON.stringify(epics));
                        console.log(epics);
                    });
            }
        }
    }
}));
