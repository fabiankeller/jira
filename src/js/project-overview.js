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
                google.charts.setOnLoadCallback(drawBarColors);

                function drawBarColors() {
                    var temp = [['Epic', 'PD Total', 'PD Done']];
                    epicData.forEach(function (entry) {
                        temp.push(entry);
                    });
                    var data = google.visualization.arrayToDataTable(temp);

                    var options = {
                        title: 'Catta Projects for 2016.05 C',
                        chartArea: {width: '80%', height: data.getNumberOfRows() * 15},
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
                    projectOverviewGadget.resize();
                }
            }


            function init() {
                google.charts.load('current', {packages: ['corechart', 'bar']});

                $("#generateChartButton").click(function () {
                        var epics = JSON.parse($('#epicsJson').val());
                        epics = window.processData(epics);
                        drawChart(epics);
                    }
                );

                // getDataAsJson()
                //     .then(function (json) {
                //         setContent(json);
                //     });
            }

            function processData() {
                return [
                    ['a', 100, 10],
                    ['b', 200, 10]
                ];
            }

            function getDataAsJson() {
                var deferred = Q.defer();

                var epics = [];
                window.jiraUtils.getEpics(config.project, config.version, config.team)
                    .then(function (epicResponse) {
                        epics = window.jiraUtils.getIssuesFromResponse(epicResponse);
                        return epics;
                    })
                    .then(function (epics) {
                        return getChildren(epics, window.jiraUtils.getStories);
                    })
                    .then(function (stories) {
                        return getChildren(stories, window.jiraUtils.getSubtasks);
                    })
                    .then(function (subtasks) {
                        deferred.resolve(JSON.stringify(epics));
                    });

                function getChildren(parentIssues, getter) {
                    var calls = [];
                    var deferred = Q.defer();

                    parentIssues.forEach(function (epic) {
                        calls.push(getter(epic.key));
                    });

                    window.Q.all(calls).then(function (storyResponses) {
                        var childrenPerParent = storyResponses.map(function (storyResponse) {
                            return window.jiraUtils.getIssuesFromResponse(storyResponse);
                        });
                        childrenPerParent.forEach(function (children, i) {
                            parentIssues[i].children = children;
                        });
                        deferred.resolve(flatten(childrenPerParent));
                    });
                    return deferred.promise;
                }

                function flatten(array) {
                    return [].concat.apply([], array);
                }

                return deferred.promise;
            }
        }
    }
}));
