console.log("called correctly");
$("body").on("click", "td", function() {
    var index = $(this).index();
    $("tr").each(function() {
        $(this).children("td").eq(index).toggleClass("highlight");
    });
});
