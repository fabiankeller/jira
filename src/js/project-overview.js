(function (global) {

    var config = {
        project: 'SAM',
        team: 'Catta',
        version: '',
        gadgetId: global.gadgetId
    };

    init();

    function drawChart(epicData) {
        google.charts.setOnLoadCallback(drawBarColors);

        function drawBarColors() {
            var temp = [['Epic', 'Story Points', 'SPs done', 'Time spent']];
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
            resize();
        }
    }

    function init() {
        if (window.projectOverviewGadgetInitialized) {
            return;
        }
        window.projectOverviewGadgetInitialized = true;

        google.charts.load('current', {packages: ['corechart', 'bar']});

        $("#generateChartButton").click(updateChart);

        $("#loadDataButton").click(function () {
                config.version = $('#releaseVersionInputText').val();
                $('#epicsJson').val('LOADING...');
                getDataAsJson()
                    .then(function (json) {
                        $('#epicsJson').val(json);
                        resize();
                        updateChart();
                    });
            }
        );
        resize();
    }

    function updateChart() {
        var json = $('#epicsJson').val();
        var epics = JSON.parse(json);
        var ignoreEmpty = $('#ignoreEmptyEpicsCheckbox').prop('checked');
        $('#epicsJson').val('');

        epics = processData(epics, ignoreEmpty);
        drawChart(epics);

        $('#epicsJson').val(json);
    }

    function processData(epics, ignoreEmpty) {
        var retval = [];

        epics.forEach(function (epic) {
            var storyPointSum = 0;
            var storyPointsDone = 0;
            var timeSpent = 0;
            var percentage = 0;

            epic.children.forEach(function (story) {
                timeSpent += numberOrZero(story.aggregateTimeSpent);
                if (story.type !== 'Story' || (ignoreEmpty && !story.sp)) { // filter out non-Stories (Tasks) or stories without SP
                    console.log('filter out issue', story);
                    return;
                }

                var sp = numberOrZero(story.sp);

                storyPointSum += sp;

                if (epic.closed || story.closed) {
                    storyPointsDone += sp;
                } else if (story.children) {
                    var numberOfSubtasks = story.children.length + 1; // plus 1 because the story should not reach 100% before it's closed
                    var numberOfSubtasksDone = 0;
                    story.children.forEach(function (subtask) {
                        if (subtask.closed) {
                            numberOfSubtasksDone++;
                        }
                    });
                    storyPointsDone += (numberOfSubtasksDone / numberOfSubtasks) * sp;
                }
            });

            timeSpent += numberOrZero(epic.aggregateTimeSpent);

            if (storyPointSum === 0) {
                if (ignoreEmpty) {
                    return;
                }
                percentage = 0;
            } else {
                percentage = storyPointsDone / storyPointSum;
            }

            retval.push([Math.floor(percentage * 100.0) + '% - ' + epic.summary, storyPointSum, storyPointSum * percentage, timeSpent / 3600 / 8.4]);
        });
        return retval;
    }

    function numberOrZero(value) {
        return isNumeric(value) ? value : 0;
    }

    function isNumeric(val) {
        return Number(parseFloat(val)) == val;
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

    function resize() {
        window.jiraUtils.resizeGadget(config.gadgetId);
    }
})(window);
