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

            // function appendStory(id, story) {
            //     var sp = story.fields.customfield_10263;
            //     var timeSpent = story.fields.timespent;
            //     var aggregatetimespent = story.fields.aggregatetimespent;
            //     $('#' + id).append('<p>---------Story: ' + story.key + ' ' + story.fields.summary + ', SP: ' + sp + ' Time spent: ' + timeSpent + ', Total: ' + aggregatetimespent + '</p>');
            // }
            //
            // function appendSubtask(id, subtask) {
            //     var sp = subtask.fields.customfield_10263;
            //     var timeSpent = subtask.fields.timespent;
            //     var aggregatetimespent = subtask.fields.aggregatetimespent;
            //     $('#' + id).append('<p>Subtask: ' + subtask.key + ' ' + subtask.fields.summary + ', SP: ' + sp + ' Time spent: ' + timeSpent + ', Total: ' + aggregatetimespent + '</p>');
            // }

            function drawChart() {
                google.charts.load('current', {packages: ['corechart', 'bar']});
                google.charts.setOnLoadCallback(drawBarColors);

                function drawBarColors() {
                    var epicData = [
                        ['a', 100, 10],
                        ['b', 200, 10]
                    ];
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
                drawChart();

                $.when(window.jiraUtils.getEpics(config.project, config.version, config.team))
                    .done(function (epicResponse) {
                        debugger;
                        var epics = window.jiraUtils.getIssuesFromResponse(epicResponse);
                        epics.forEach(function (epic, i) {
                            var id = 'overview_epic_' + i;

                            appendEpic(id, epic);

//                             $.when(loadStories(epic.key))
//                                 .done(function (jiraResponse) {
//                                     getIssues(jiraResponse).forEach(function (story, i) {
//                                         appendStory(id, story);
// //													$.when(loadSubtasks(story.key))
// //															.done(function (jiraResponse) {
// //																getIssues(jiraResponse).forEach(function (subtask, i) {
// //																	appendSubtask(id, subtask);
// //																});
// //															});
//                                     });
//                                 });
                        });

                    });
            }
        }
    }
}));
