var timelineGadget;
timelineGadget || (timelineGadget = AJS.Gadget({
    baseUrl: 'http://jira.swisscom.com',
    view: {
        onResizeAdjustHeight: true,
        template: function () {
            var templateReference = this;
            var $ = AJS.$;

            var config = {
                project: 'SAM',
                team: 'Catta',
                fixVersion: '2016.05 C'
            }

            function makeJqlQuery(queryString) {
                var url = '/rest/api/2/search?jql=' + encodeURI(queryString);
                console.log('calling url: ' + url);
                return $.ajax({
                    url: url,
                    contentType: 'application/json',
                    async: false,
                    dataType: 'json'
                });
            }

            function loadEpics() {
                return makeJqlQuery('project = ' + config.project + ' AND issuetype = Epic AND fixVersion = "' + config.fixVersion + '" AND Team = ' + config.team);
            }

            function loadStories(epicId) {
                return makeJqlQuery('issueFunction in linkedIssuesOf("\'issue\' = \'' + epicId + '\'", "is Epic of")');
            }

            function loadSubtasks(storyId) {
                return makeJqlQuery('issueFunction in subtasksOf("id = ' + storyId + '")');
            }

            function getIssues(jiraResponse) {
                return JSON.parse(jiraResponse.responseText).issues;
            }

            function appendEpic(id, epic) {
                var sp = epic.fields.customfield_10263;
                var timeSpent = epic.fields.timespent;
                var aggregatetimespent = epic.fields.aggregatetimespent;
                $('#overview_epics').append('<div id="' + id + '"><p><b>Epic: ' + epic.key + ' ' + epic.fields.summary + ', SP: ' + sp + ' Time spent: ' + timeSpent + ', Total: ' + aggregatetimespent + '</b></p></div>');
            }

            function appendStory(id, story) {
                var sp = story.fields.customfield_10263;
                var timeSpent = story.fields.timespent;
                var aggregatetimespent = story.fields.aggregatetimespent;
                $('#' + id).append('<p>---------Story: ' + story.key + ' ' + story.fields.summary + ', SP: ' + sp + ' Time spent: ' + timeSpent + ', Total: ' + aggregatetimespent + '</p>');
            }

            function appendSubtask(id, subtask) {
                var sp = subtask.fields.customfield_10263;
                var timeSpent = subtask.fields.timespent;
                var aggregatetimespent = subtask.fields.aggregatetimespent;
                $('#' + id).append('<p>Subtask: ' + subtask.key + ' ' + subtask.fields.summary + ', SP: ' + sp + ' Time spent: ' + timeSpent + ', Total: ' + aggregatetimespent + '</p>');
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

            var epicData = [
                ['a', 100, 10],
                ['b', 200, 10]
            ];

            drawChart(epicData);
            $.when(loadEpics())
                .done(function (jiraResponse) {
                    getIssues(jiraResponse).forEach(function (epic, i) {
                        var id = 'overview_epic_' + i;
                        appendEpic(id, epic);
                        $.when(loadStories(epic.key))
                            .done(function (jiraResponse) {
                                getIssues(jiraResponse).forEach(function (story, i) {
                                    appendStory(id, story);
//													$.when(loadSubtasks(story.key))
//															.done(function (jiraResponse) {
//																getIssues(jiraResponse).forEach(function (subtask, i) {
//																	appendSubtask(id, subtask);
//																});
//															});
                                });
                            });
                    });

                });

        }
    }
}));
