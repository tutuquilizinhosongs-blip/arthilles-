$service = $args[0]

if ($service) {
  docker compose logs -f $service
} else {
  docker compose logs -f
}
