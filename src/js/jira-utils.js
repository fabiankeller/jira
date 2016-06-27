(function () {
    window.jiraUtils = {
        jqlQuery: jqlQuery,
        getEpics: getEpics,
        getStories: getStories,
        getSubtasks: getSubtasks,
        getIssuesFromResponse: getIssuesFromResponse,
        resizeGadget: resizeGadget
    };

    function jqlQuery(queryString) {
        var url = '/rest/api/2/search?jql=' + encodeURI(queryString);
        console.log('performing jql query:', url);
        return Q($.ajax({
            url: url,
            contentType: 'application/json',
            async: true,
            dataType: 'json'
        }));
    }

    function getEpics(project, version, team) {
        return jqlQuery('project = ' + project + ' AND issuetype = Epic AND fixVersion = "' + version + '" AND Team = ' + team);
    }

    function getStories(epicId) {
        return jqlQuery('issueFunction in linkedIssuesOf("\'issue\' = \'' + epicId + '\'", "is Epic of")');
    }

    function getSubtasks(storyId) {
        return jqlQuery('issueFunction in subtasksOf("id = ' + storyId + '")');
    }

    function getIssuesFromResponse(jiraResponse) {
        var issuesRaw = jiraResponse.issues;
        var issueProcessed = [];
        issuesRaw.forEach(function (issue, i) {
            issueProcessed.push({
                index: i,
                key: issue.key,
                type: issue.fields.issuetype.name,
                summary: issue.fields.summary,
                sp: issue.fields.customfield_10263,
                originalEstimate: issue.fields.timeoriginalestimate,
                timeSpent: issue.fields.timespent,
                aggregateTimeSpent: issue.fields.aggregatetimespent,
                statusName: issue.fields.status.name,
                closed: isClosed(issue.fields.status.name),
                children: []
            });
        });
        return issueProcessed;
    }

    function isClosed(statusName) {
        return statusName === 'Closed' || statusName === 'Resolved' || statusName === 'Cancelled';
    }

    function resizeGadget(gadgetId) {
        console.log('resize', gadgetId);
        window.parent.AJS.$('#' + gadgetId + ' iframe').css('height', 500);
        window.parent.AJS.$.each(window.parent.AG.DashboardManager.activeLayout.getGadgets(), function (index, gadget) {
            gadget.resize();
        });
    }
})();