(function ($) {
	
	"use strict";

	// Header Type = Fixed
  $(window).scroll(function() {
    var scroll = $(window).scrollTop();
    var box = $('.header-text').height();
    var header = $('header').height();

    if (scroll >= box - header) {
      $("header").addClass("background-header");
    } else {
      $("header").removeClass("background-header");
    }
  });


	$('.loop').owlCarousel({
      center: true,
      items:1,
      loop:true,
      autoplay: true,
      nav: true,
      margin:0,
      responsive:{ 
          1200:{
              items:5
          },
          992:{
              items:3
          },
          760:{
            items:2
        }
      }
  });
	

	// Menu Dropdown Toggle
  if($('.menu-trigger').length){
    $(".menu-trigger").on('click', function() { 
      $(this).toggleClass('active');
      $('.header-area .nav').slideToggle(200);
    });
  }


  // Menu elevator animation
  $('.scroll-to-section a[href*=\\#]:not([href=\\#])').on('click', function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        var width = $(window).width();
        if(width < 991) {
          $('.menu-trigger').removeClass('active');
          $('.header-area .nav').slideUp(200);  
        }       
        $('html,body').animate({
          scrollTop: (target.offset().top) + 1
        }, 700);
        return false;
      }
    }
  });

  $(document).ready(function () {
      $(document).on("scroll", onScroll);
      
      //smoothscroll
      $('.scroll-to-section a[href^="#"]').on('click', function (e) {
          e.preventDefault();
          $(document).off("scroll");
          
          $('.scroll-to-section a').each(function () {
              $(this).removeClass('active');
          })
          $(this).addClass('active');
        
          var target = this.hash,
          menu = target;
          var target = $(this.hash);
          $('html, body').stop().animate({
              scrollTop: (target.offset().top) + 1
          }, 500, 'swing', function () {
              window.location.hash = target;
              $(document).on("scroll", onScroll);
          });
      });
  });

  function onScroll(event){
      var scrollPos = $(document).scrollTop();
      $('.nav a').each(function () {
          var currLink = $(this);
          var refElement = $(currLink.attr("href"));
          if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
              $('.nav ul li a').removeClass("active");
              currLink.addClass("active");
          }
          else{
              currLink.removeClass("active");
          }
      });
  }


  // Acc
  $(document).on("click", ".naccs .menu div", function() {
    var numberIndex = $(this).index();

    if (!$(this).is("active")) {
        $(".naccs .menu div").removeClass("active");
        $(".naccs ul li").removeClass("active");

        $(this).addClass("active");
        $(".naccs ul").find("li:eq(" + numberIndex + ")").addClass("active");

        var listItemHeight = $(".naccs ul")
          .find("li:eq(" + numberIndex + ")")
          .innerHeight();
        $(".naccs ul").height(listItemHeight + "px");
      }
  });


	// Page loading animation
	 $(window).on('load', function() {

        $('#js-preloader').addClass('loaded');

    });

	

	// Window Resize Mobile Menu Fix
  function mobileNav() {
    var width = $(window).width();
    $('.submenu').on('click', function() {
      if(width < 767) {
        $('.submenu ul').removeClass('active');
        $(this).find('ul').toggleClass('active');
      }
    });
  }




})(window.jQuery);


function showMore() {
  var moreText = document.getElementById("more-text");
  var btnText = document.getElementById("show-more-btn");
  var isPortuguese = document.documentElement.lang === "pt"; // Check if the language is set to Portuguese

  if (moreText.style.display === "none") {
    moreText.style.display = "inline";
    btnText.textContent = isPortuguese ? "Ver Menos" : "Show Less"; // Change the button text based on language
  } else {
    moreText.style.display = "none";
    btnText.textContent = isPortuguese ? "Ver Mais" : "Show More"; // Change the button text back based on language
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const imageRow = document.getElementById("imageRow");
  let scrolling = true;
  let baseSpeed = 20; // Base speed for scrolling
  let currentSpeed = baseSpeed;

  // Function to clone images for infinite scroll effect
  function cloneImages() {
    const images = Array.from(document.querySelectorAll(".image-row .image-container"));
    images.forEach(image => {
      const clone = image.cloneNode(true);
      imageRow.appendChild(clone);
    });
  }

  // Initial clone to fill the row
  for (let i = 0; i < 5; i++) {
    cloneImages();
  }

  // Function to handle infinite scroll
  function infiniteScroll() {
    if (scrolling) {
      imageRow.scrollLeft += 1;
      if (imageRow.scrollLeft >= imageRow.scrollWidth / 2) {
        imageRow.scrollLeft = 0;
      }
    }
  }

  // Adjust the interval to control the scroll speed dynamically
  let scrollInterval = setInterval(infiniteScroll, currentSpeed);

  // Adjust scrolling speed on hover
  imageRow.addEventListener('mouseover', () => {
    clearInterval(scrollInterval); // Clear existing interval
    currentSpeed = 30; // Slow down the speed
    scrollInterval = setInterval(infiniteScroll, currentSpeed); // Set new interval with slower speed
  });

  imageRow.addEventListener('mouseout', () => {
    clearInterval(scrollInterval); // Clear existing interval
    currentSpeed = baseSpeed; // Reset to original speed
    scrollInterval = setInterval(infiniteScroll, currentSpeed); // Set new interval with original speed
  });
  
});