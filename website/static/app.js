$("body").on("click", "td", function() {
    console.log("called correctly");
    var index = $(this).index();
    $("tr").each(function() {
        $(this).children("td").eq(index).toggleClass("highlight");
    });
});
