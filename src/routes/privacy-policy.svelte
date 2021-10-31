<svelte:head>
    <!-- Hotjar Tracking Code for https://gianmarco.xyz -->
    <script>
        (function (h, o, t, j, a, r) {
            h.hj =
                h.hj ||
                function () {
                    (h.hj.q = h.hj.q || []).push(arguments);
                };
            h._hjSettings = { hjid: 2388272, hjsv: 6 };
            a = o.getElementsByTagName('head')[0];
            r = o.createElement('script');
            r.async = 1;
            r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
            a.appendChild(r);
        })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
    </script>
</svelte:head>

<div class="container">
	<main>
		<h1>Privacy Policy</h1>
		<p>
			We use Hotjar in order to better understand our users’ needs and to optimize this service and
			experience. Hotjar is a technology service that helps us better understand our users
			experience (e.g. how much time they spend on which pages, which links they choose to click,
			what users do and don’t like, etc.) and this enables us to build and maintain our service with
			user feedback. Hotjar uses cookies and other technologies to collect data on our users’
			behavior and their devices (in particular device's IP address (captured and stored only in
			anonymized form), device screen size, device type (unique device identifiers), browser
			information, geographic location (country only), preferred language used to display our
			website). Hotjar stores this information in a pseudonymized user profile. Neither Hotjar nor
			we will ever use this information to identify individual users or to match it with further
			data on an individual user. For further details, please see Hotjar’s privacy policy by
			clicking on this link. You can opt-out to the creation of a user profile, Hotjar’s storing of
			data about your usage of our site and Hotjar’s use of tracking cookies on other websites by
			following this opt-out link.
		</p>
	</main>
</div>

<style>
	.container {
		max-width: 900px;
		padding: 1em;
		display: flex;
		justify-content: center;
	}

	main {
		min-height: 500px;
		text-align: center;
		margin: 0 auto;
		box-sizing: border-box;
	}

	h1 {
		font-weight: 700;
		margin: 0 0 50px 0;
		font-size: 36px;
		text-align: start;
	}

	@media (min-width: 900px) {
		main > h1 {
			font-size: 48px;
		}
	}
</style>
