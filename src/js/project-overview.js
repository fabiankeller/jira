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

            function appendEpic(id, epic) {
                $('#overview_epics').append('<div id="' + id + '"><p><b>Epic: ' + epic.key + ' ' + epic.summary + ', SP: ' + epic.sp + ' Time spent: ' + epic.timeSpent + ', Total: ' + epic.aggregateTimeSpent + '</b></p></div>');
            }

            function appendStory(id, story) {
                $('#' + id).append('<p>---------Story: ' + story.key + ' ' + story.summary + ', SP: ' + story.sp + ' Time spent: ' + story.timeSpent + ', Total: ' + story.aggregateTimeSpent + '</p>');
            }

            // function appendSubtask(id, subtask) {
            //     var sp = subtask.fields.customfield_10263;
            //     var timeSpent = subtask.fields.timespent;
            //     var aggregatetimespent = subtask.fields.aggregatetimespent;
            //     $('#' + id).append('<p>Subtask: ' + subtask.key + ' ' + subtask.fields.summary + ', SP: ' + sp + ' Time spent: ' + timeSpent + ', Total: ' + aggregatetimespent + '</p>');
            // }

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
                                epics[i].children.push(story);
                            });
                            deferred.resolve(stories);
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
                                stories[i].children.push(subtask);
                            });
                            deferred.resolve(subtasks);
                        });
                        return deferred.promise;
                    })
                    .then(function (subtasks) {
                        console.log(epics);
                    });

                // window.jiraUtils.getEpics(config.project, config.version, config.team)
                //     .then(function (epicResponse) {
                //         var epics = window.jiraUtils.getIssuesFromResponse(epicResponse);
                //
                //         epics.forEach(function (epic) {
                //             // var epicElementId = 'overview_epic_' + i;
                //             // appendEpic(epicElementId, epic);
                //             pendingCalls.push(window.jiraUtils.getStories(epic.key));
                //         });
                //
                //         window.Q.all(pendingCalls).done(function (storyResponses) {
                //             storyResponses.forEach(function (storyResponse, epicIndex) {
                //
                //                 var stories = window.jiraUtils.getIssuesFromResponse(storyResponse);
                //                 pendingCalls = [];
                //                 stories.forEach(function (story) {
                //                     epics[epicIndex].children.push(story);
                //                     pendingCalls.push(window.jiraUtils.getSubtasks(story.key));
                //                 });
                //             });
                //
                //             window.Q.all(pendingCalls).done(function (subtaskResponses) {
                //                 subtaskResponses.forEach(function (subtaskResponse, storyIndex) {
                //                     var subtasks = window.jiraUtils.getIssuesFromResponse(subtaskResponse);
                //                     subtasks.forEach(function (subtask) {
                //                         epics[epicIndex].children[storyIndex].children.push(subtask);
                //                     });
                //                 });
                //                 console.log('data', epics);
                //             });
                //         });
                //     });
            }
        }
    }
}));
