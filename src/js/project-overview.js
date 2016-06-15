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
                version: '2016.11 C'
            };

            init();

            function drawChart(epicData) {
                google.charts.setOnLoadCallback(drawBarColors);

                function drawBarColors() {
                    var temp = [['Epic', 'Story Points', 'Percentage', 'Time spent']];
                    epicData.forEach(function (entry) {
                        temp.push(entry);
                    });
                    var data = google.visualization.arrayToDataTable(temp);

                    var options = {
                        title: config.team + ' projects for ' + config.version,
                        chartArea: {width: '60%'},
                        height: (data.getNumberOfRows() + 1) * 50,
                        colors: ['#999999', '#1122aa', '#11aa22'],
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
                        var ignoreEmpty = $('#ignoreEmptyEpicsCheckbox').prop('checked');
                        epics = window.processData(epics, ignoreEmpty);
                        drawChart(epics);
                    }
                );

                $("#loadDataButton").click(function () {
                    $('#epicsJson').val('LOADING...');
                        getDataAsJson()
                            .then(function (json) {
                                $('#epicsJson').val(json);
                            });
                    }
                );
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
