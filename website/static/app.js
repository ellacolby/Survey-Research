function registering_click() {
    $("body").on("click", "td", function() {
        console.log("called correctly");
        var index = $(this).index();
        $("td").removeClass("highlight");
        $("tr").each(function() {
            $(this).children("td").eq(index).toggleClass("highlight");
        });
    });
}
