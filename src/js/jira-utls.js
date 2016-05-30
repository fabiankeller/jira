(function () {
    window.jiraUtils = {
        jqlQuery: jqlQuery,
        getEpics: getEpics,
        getStories: getStories,
        getSubtasks: getSubtasks,
        getIssuesFromResponse: getIssuesFromResponse
    };

    function jqlQuery(queryString) {
        var url = '/rest/api/2/search?jql=' + encodeURI(queryString);
        console.log('performing jql query:', url);
        return $.ajax({
            url: url,
            contentType: 'application/json',
            async: false,
            dataType: 'json'
        });
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
        var issuesRaw = JSON.parse(jiraResponse.responseText).issues;
        var issueProcessed = [];
        issuesRaw.forEach(function (issue, i) {
            issueProcessed.push({
                index: i,
                key: issue.key,
                summary: issue.fields.summary,
                sp: issue.fields.customfield_10263,
                timeSpent: issue.fields.timespent,
                aggregateTimeSpent: issue.fields.aggregatetimespent,
                children: []
            });
        });
    }
})();